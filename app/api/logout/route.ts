import {NextResponse} from "next/server";
import {sessionCookieName} from "@/lib/auth";
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set(sessionCookieName,"",{path:"/",maxAge:0});return r;}
