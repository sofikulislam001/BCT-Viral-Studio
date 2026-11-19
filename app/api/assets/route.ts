import {NextResponse} from "next/server";
import {isAuthed} from "@/lib/auth";
import {supabaseAdmin} from "@/lib/supabase";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!(await isAuthed()))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const {dataUrl}=await req.json(); const match=String(dataUrl||"").match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
  if(!match)return NextResponse.json({error:"Invalid image"},{status:400});
  const ext=match[1]==="jpeg"?"jpg":match[1]; const bytes=Buffer.from(match[2],"base64");
  if(bytes.length>8*1024*1024)return NextResponse.json({error:"Image must be under 8MB"},{status:413});
  const db=supabaseAdmin(); const bucket=process.env.SUPABASE_BUCKET||"bct-memes";
  const path=`memes/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const {error}=await db.storage.from(bucket).upload(path,bytes,{contentType:`image/${match[1]}`,upsert:false});
  if(error)throw error;
  const {data}=db.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({url:data.publicUrl});
 }catch(e:any){return NextResponse.json({error:e.message||"Upload failed"},{status:500});}
}
