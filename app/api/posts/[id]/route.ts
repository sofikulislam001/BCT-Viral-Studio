import {NextResponse} from "next/server";
import {isAuthed} from "@/lib/auth";
import {supabaseAdmin} from "@/lib/supabase";
export async function PATCH(req:Request,{params}:{params:{id:string}}){
 if(!(await isAuthed()))return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const {action}=await req.json();const db=supabaseAdmin();
  if(action==="reject"){const {error}=await db.from("bct_posts").update({status:"rejected"}).eq("id",params.id);if(error)throw error;return NextResponse.json({ok:true});}
  if(action==="publish"){const {data,error}=await db.from("bct_posts").select("*").eq("id",params.id).single();if(error)throw error;const result=await publishPhoto(data.image_url,data.caption);await db.from("bct_posts").update({status:"published",published_at:new Date().toISOString(),facebook_post_id:result.id}).eq("id",params.id);return NextResponse.json({ok:true});}
  return NextResponse.json({error:"Unknown action"},{status:400});
 }catch(e:any){return NextResponse.json({error:e.message||"Action failed"},{status:500});}
}
async function publishPhoto(url:string,caption:string){
 const page=process.env.META_PAGE_ID,token=process.env.META_PAGE_ACCESS_TOKEN,version=process.env.META_GRAPH_VERSION||"v23.0";
 if(!page||!token)throw new Error("Meta Page ID/Token not configured");
 const form=new URLSearchParams({url,caption,access_token:token});
 const r=await fetch(`https://graph.facebook.com/${version}/${page}/photos`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form});
 const j=await r.json();if(!r.ok||j.error)throw new Error(j.error?.message||"Meta publish failed");return j;
}
