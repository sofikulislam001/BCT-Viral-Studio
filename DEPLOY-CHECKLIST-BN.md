# BCT VIRAL STUDIO — মোবাইল থেকে সেটআপ চেকলিস্ট

## A. আগে Supabase
1. https://supabase.com/ এ Project তৈরি করুন।
2. SQL Editor খুলে `supabase/schema.sql`-এর সব SQL Run করুন।
3. Storage-এ `bct-memes` নামে Public bucket বানান।
4. Project Settings → API থেকে Project URL ও service_role key কপি করুন। এগুলো কাউকে পাঠাবেন না।

## B. Meta Facebook
1. https://developers.facebook.com/ এ App তৈরি করুন।
2. আপনার Page-এ আপনার অ্যাকাউন্টের যথেষ্ট access থাকতে হবে।
3. Page publishing permission-সহ Page Access Token নিন। সাধারণত `pages_manage_posts` দরকার হয়; Page নির্বাচন/তথ্যের জন্য Meta-র চাওয়া অতিরিক্ত permission-ও লাগতে পারে।
4. আপনার Page ID: `1389119647626527` — সঠিক Page কি না যাচাই করুন।
5. Meta App Review/permission approval চাইলে Meta-র নির্দেশনা অনুসরণ করুন।

## C. Vercel
Vercel → Project → Settings → Environment Variables-এ `.env.example`-এর মানগুলো দিন।
- `DASHBOARD_PASSWORD`: আপনার নিজের লগইন পাসওয়ার্ড
- `AUTH_SECRET`: দীর্ঘ random secret
- `SUPABASE_URL`: Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SUPABASE_BUCKET`: `bct-memes`
- `META_PAGE_ID`: `1389119647626527`
- `META_PAGE_ACCESS_TOKEN`: Page Token
- `META_GRAPH_VERSION`: `v23.0`
- `CRON_SECRET`: আরেকটি দীর্ঘ random secret
- `GEMINI_API_KEY`: ঐচ্ছিক

সবগুলো যোগ করার পর Redeploy দিন।

## D. চালানো
1. ওয়েবসাইট খুলে `DASHBOARD_PASSWORD` দিয়ে লগইন করুন।
2. Trend Radar থেকে বিষয় নিন।
3. Meme Studio-তে লেখা তৈরি ও Edit করুন।
4. Create Design & Add to Queue চাপুন।
5. Queue-তে Preview দেখে Publish Now চাপুন।
6. পরীক্ষা সফল হলে Settings-এ Approval OFF করে Master Automation ও Photo Automation ON করতে পারবেন। এতে নির্ধারিত পোস্ট Cron-এর মাধ্যমে নিজে প্রকাশ হবে।

**সতর্কতা:** API Token, service role key, password কখনো GitHub-এ বা Chat-এ দেবেন না। Video/Reels এখন বন্ধ এবং Coming Soon।


**Cron:** Vercel Hobby plan-এ প্রতি ১৫ মিনিটের cron চলে না, তাই `vercel.json`-এ cron রাখা হয়নি। একটি বিনামূল্যের external cron service (যেমন cron-job.org) দিয়ে প্রতি ১৫ মিনিটে `https://YOUR-APP.vercel.app/api/cron` কল করুন এবং header-এ `Authorization: Bearer <CRON_SECRET>` দিন।
