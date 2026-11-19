import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { generateBackgroundPng } from "@/lib/imagegen";

export const runtime = "nodejs";

// Returns { dataUrl } with an AI background PNG, or { dataUrl: null } so the
// client can fall back to the plain design. Never fails the whole post.
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { topic } = await req.json();
    const png = await generateBackgroundPng(String(topic || "funny Bangla life").slice(0, 120));
    if (!png) return NextResponse.json({ dataUrl: null });
    return NextResponse.json({ dataUrl: "data:image/png;base64," + png.toString("base64") });
  } catch {
    return NextResponse.json({ dataUrl: null });
  }
}
