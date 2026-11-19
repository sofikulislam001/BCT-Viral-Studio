import { NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { getTrends } from "@/lib/trends";
import { makeCaption } from "@/lib/ai";
import { safeEqual } from "@/lib/auth";
import { dhakaDayStart } from "@/lib/time";

export const dynamic = "force-dynamic";

const AUTO_PREFIX = "auto:";

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}
function wrapWords(text: string, max = 22) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (t.length > max && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}
function memeSvg(headline: string, subtext: string) {
  const lines = wrapWords(headline, 22), sub = wrapWords(subtext, 32);
  const headlineSvg = lines.map((l, i) => `<text x="540" y="${420 + i * 94}" text-anchor="middle" font-size="68" font-weight="800" fill="#ffffff">${escapeXml(l)}</text>`).join("");
  const subSvg = sub.map((l, i) => `<text x="540" y="${760 + i * 58}" text-anchor="middle" font-size="38" font-weight="600" fill="#ddd6fe">${escapeXml(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17122c"/><stop offset=".55" stop-color="#24134b"/><stop offset="1" stop-color="#090b17"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#g)"/><rect x="36" y="36" width="1008" height="1008" fill="none" stroke="#a78bfa" stroke-width="8"/><text x="70" y="110" fill="#c4b5fd" font-family="Arial,sans-serif" font-size="38" font-weight="700">BCT • VIRAL STUDIO</text>${headlineSvg}${subSvg}<text x="540" y="960" text-anchor="middle" fill="#a78bfa" font-family="Arial,sans-serif" font-size="30" font-weight="700">FOLLOW • SHARE • LAUGH</text></svg>`;
}

async function makeAutoPost(db: any) {
  const trends = await getTrends();
  if (!trends.length) return null;
  const { data: used } = await db.from("bct_trend_runs").select("trend_title");
  const usedSet = new Set((used || []).map((x: any) => x.trend_title));
  const trend = trends.find((x: any) => !usedSet.has(x.title));
  if (!trend) return null;

  const content = await makeCaption(trend.title);
  const svg = memeSvg(content.headline || trend.title, content.subtext || "এই পরিস্থিতিতে আমিই শুধু এমন নাকি? 😂");
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const bucket = process.env.SUPABASE_BUCKET || "bct-memes";
  const path = `auto/${Date.now()}-${randomUUID()}.png`;
  const { error: uploadError } = await db.storage.from(bucket).upload(path, png, { contentType: "image/png" });
  if (uploadError) throw uploadError;
  const { data: urlData } = db.storage.from(bucket).getPublicUrl(path);
  const caption = [content.caption, (content.hashtags || []).join(" ")].filter(Boolean).join(" ");

  const { data: post, error } = await db
    .from("bct_posts")
    .insert({
      topic: trend.title,
      caption,
      image_url: urlData.publicUrl,
      status: "pending",
      source: AUTO_PREFIX + (trend.link || trend.source),
    })
    .select()
    .single();
  if (error) throw error;
  await db.from("bct_trend_runs").insert({ trend_title: trend.title });
  return post;
}

async function publish(post: any, db: any, now: Date) {
  const version = process.env.META_GRAPH_VERSION || "v23.0";
  const form = new URLSearchParams({
    url: post.image_url,
    caption: post.caption,
    access_token: process.env.META_PAGE_ACCESS_TOKEN || "",
  });
  const r = await fetch(`https://graph.facebook.com/${version}/${process.env.META_PAGE_ID}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const j = await r.json();
  if (!r.ok || j.error) {
    await db.from("bct_posts").update({ status: "failed", error: j.error?.message || "Meta API error" }).eq("id", post.id);
    throw new Error(j.error?.message || "Meta API error");
  }
  await db
    .from("bct_posts")
    .update({ status: "published", published_at: now.toISOString(), facebook_post_id: j.id, error: null })
    .eq("id", post.id);
  return j.id;
}

// Only publish what is due: a scheduled post whose time has come, or an
// auto-generated trend post. Manual drafts with no schedule stay in the queue
// until you press Publish Now, even when approval is OFF.
function isDue(post: any, now: Date) {
  if (post.scheduled_at) return new Date(post.scheduled_at) <= now;
  return typeof post.source === "string" && post.source.startsWith(AUTO_PREFIX);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET || "";
  const valid =
    !!secret &&
    (safeEqual(auth, `Bearer ${secret}`) || safeEqual(url.searchParams.get("secret") || "", secret));
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = supabaseAdmin();
    const { data: settings, error: se } = await db.from("bct_settings").select("*").eq("id", 1).single();
    if (se) throw se;
    if (!settings.automation_enabled || !settings.photo_enabled)
      return NextResponse.json({ ok: true, message: "Automation is OFF" });

    const now = new Date();
    const { count } = await db
      .from("bct_posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", dhakaDayStart(now).toISOString());
    if ((count || 0) >= settings.daily_limit)
      return NextResponse.json({ ok: true, message: "Daily limit reached" });

    const { data: queued, error } = await db
      .from("bct_posts")
      .select("*")
      .in("status", ["pending", "scheduled"])
      .order("created_at")
      .limit(50);
    if (error) throw error;

    let post = (queued || []).find((p: any) => isDue(p, now));
    if (!post) {
      post = await makeAutoPost(db);
      if (!post) return NextResponse.json({ ok: true, message: "No unused public trend found" });
    }

    if (settings.approval_required) {
      return NextResponse.json({ ok: true, message: "Waiting for manual approval", post_id: post.id });
    }

    const id = await publish(post, db, now);
    return NextResponse.json({ ok: true, published: id, topic: post.topic });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Cron failed" }, { status: 500 });
  }
}
