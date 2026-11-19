import {NextResponse} from "next/server";
import {isAuthed} from "@/lib/auth";
import {getTrends} from "@/lib/trends";
export const dynamic="force-dynamic";
export async function GET(){if(!(await isAuthed()))return NextResponse.json({error:"Unauthorized"},{status:401});return NextResponse.json({items:await getTrends()});}
