import {NextResponse} from "next/server";
import {isAuthed} from "@/lib/auth";
import {makeCaption} from "@/lib/ai";
export async function POST(req:Request){
 if(!(await isAuthed()))return NextResponse.json({error:"Unauthorized"},{status:401});
 const {topic}=await req.json(); if(!topic?.trim())return NextResponse.json({error:"বিষয় লিখুন"},{status:400});
 try{return NextResponse.json(await makeCaption(topic));}catch(e:any){return NextResponse.json({error:e.message||"Generation failed"},{status:500});}
}
