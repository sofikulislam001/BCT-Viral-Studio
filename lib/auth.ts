import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "bct_session";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Session is bound to AUTH_SECRET AND the dashboard password, so changing the
// password invalidates every existing session.
function signature(value: string) {
  const secret = process.env.AUTH_SECRET || "";
  const pw = process.env.DASHBOARD_PASSWORD || "";
  return crypto.createHmac("sha256", secret).update(`${pw}|${value}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function passwordMatches(input: unknown) {
  const expected = process.env.DASHBOARD_PASSWORD || "";
  if (!expected || typeof input !== "string") return false;
  return safeEqual(crypto.createHash("sha256").update(input).digest("hex"), crypto.createHash("sha256").update(expected).digest("hex"));
}

export function makeSession() {
  const issued = String(Date.now());
  return `${issued}.${signature(issued)}`;
}

export async function isAuthed() {
  if (!process.env.DASHBOARD_PASSWORD || !process.env.AUTH_SECRET) return false;
  const raw = cookies().get(COOKIE)?.value || "";
  const [issued, sig] = raw.split(".");
  if (!issued || !sig) return false;
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > WEEK_MS) return false;
  return safeEqual(sig, signature(issued));
}

export const sessionCookieName = COOKIE;

// Best-effort login throttle. Serverless instances do not share memory, so this
// is a speed bump, not a hard guarantee.
const attempts = new Map<string, { count: number; resetAt: number }>();
export function loginAllowed(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 10;
}
