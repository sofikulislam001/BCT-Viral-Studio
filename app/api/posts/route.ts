import {NextResponse} from "next/server";
import {isAuthed} from "@/lib/auth";
import {supabaseAdmin} from "@/lib/supabase";

export async function GET(){
 if(!(await isAuthed()))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const {data,error}=await supabaseAdmin().from("bct_posts").select("*").order("created_at",{ascending:false}).limit(60);if(error)throw error;return NextResponse.json({items:data||[]});}
 catch(e:any){return NextResponse.json({error:e.message},{status:500});}
}

// Only accept images that live in our own Supabase storage bucket, so the
// dashboard cannot be used to push arbitrary URLs to the Facebook Page.
function isOwnImageUrl(url: string) {
 const base = process.env.SUPABASE_URL;
 if (!base) return false;
 try {
  const u = new URL(url), b = new URL(base);
  return u.origin === b.origin && u.pathname.startsWith("/storage/v1/object/public/");
 } catch { return false; }
}

export async function POST(req:Request){
 if(!(await isAuthed()))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await req.json();
  if(!body.topic||!body.caption||!body.image_url) return NextResponse.json({error:"Topic, caption and image required"},{status:400});
  if(!isOwnImageUrl(String(body.image_url))) return NextResponse.json({error:"Invalid image location"},{status:400});

  let scheduledAt: string | null = null;
  if (body.scheduled_at) {
   const d = new Date(body.scheduled_at);
   if (Number.isNaN(d.getTime())) return NextResponse.json({error:"Invalid schedule time"},{status:400});
   scheduledAt = d.toISOString();
  }

  const {data,error}=await supabaseAdmin().from("bct_posts").insert({
   topic:String(body.topic).slice(0,200),
   caption:String(body.caption).slice(0,2200),
   image_url:String(body.image_url),
   status:scheduledAt?"scheduled":"pending",
   scheduled_at:scheduledAt,
   source:"manual",
  }).select().single();
  if(error)throw error;return NextResponse.json({item:data});
 }catch(e:any){return NextResponse.json({error:e.message||"Save failed"},{status:500});}
}
