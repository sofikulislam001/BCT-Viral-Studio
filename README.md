# BCT VIRAL STUDIO — Complete deployable MVP

A mobile-friendly Bangla meme/photo publishing dashboard for the Facebook Page configured by the owner. Video/Reels are intentionally disabled and shown as COMING SOON.

## Included
- Password-protected admin dashboard
- Trend Radar using public RSS feeds (Google Trends Bangladesh + Bing News RSS by default)
- Bangla meme text/caption generation using Gemini when configured; offline fallback copy if not
- Original square graphic meme image generation in browser (no third-party image assets)
- Image upload to Supabase Storage
- Draft/approval queue, schedule field, history and manual Publish Now
- Automation master/photo toggles, daily limit 1–20 (default 2), approval mode
- Server cron endpoint: discovers a fresh public RSS trend, generates a Bangla meme and PNG, queues it, then publishes automatically when approval is disabled
- Facebook Page photo publishing through the official Meta Graph API
- Video/Reels controls are not implemented and remain COMING SOON

## Important limitations (read before deployment)
1. This is a deployable MVP, not a guarantee of zero-setup operation. The owner must create/configure Meta, Supabase and Vercel accounts and supply secrets privately.
2. Trend discovery is from public RSS feeds, not private Facebook feeds. It does not scrape or copy other people's Facebook posts.
3. The app creates original text-based graphic designs. It does not generate photorealistic AI pictures. Auto trend-to-post generation is driven by available public RSS feed items.
4. Facebook publishing works only after the Page token, Meta app permissions and Page access are correctly configured. Meta may require app review/advanced access depending on account/app status.
5. Vercel Cron availability and limits depend on the Vercel plan. If Cron is unavailable on the chosen plan, use an external cron service to call `/api/cron?secret=YOUR_CRON_SECRET` every 15 minutes.
6. Do not enable unattended publishing until you have tested the Page token and reviewed the content. Approval mode is ON by default.
7. Daily cap is checked by the cron route. Manual "Publish Now" is an explicit action and does not use the cron cap.
8. For security, never share Page Access Tokens, service-role keys, Gemini keys, or dashboard passwords in chat or GitHub.

## 1) Create Supabase project
- Create a project at https://supabase.com/
- Open SQL Editor and run all of `supabase/schema.sql`
- Open Storage and create a **public** bucket named `bct-memes`
- Copy Project URL and service role key from Project Settings -> API

## 2) Configure Meta Page publishing
- Go to https://developers.facebook.com/ and create a Meta app
- Add the Facebook Login / relevant Page publishing products as required by Meta's current dashboard
- Ensure the app/user has access to the target Page
- Obtain a Page Access Token with the required Page permissions, including `pages_manage_posts` and the relevant Page read/list permissions
- Set the Page ID to `61596421270250` (verify this is the intended Page)
- Meta may require app review, business verification, or permissions approval. This app cannot bypass Meta requirements.
- Test first with approval mode ON and one test post.

## 3) Optional Gemini
- Create a key at https://aistudio.google.com/app/apikey
- Add it as `GEMINI_API_KEY`. If omitted, a basic fallback caption is used.

## 4) Deploy on GitHub + Vercel (mobile browser)
- Extract the ZIP on your phone.
- Upload the contents (not the ZIP itself) to your repository root: https://github.com/sofikulislam001/BCT-Viral-Studio
- In Vercel, import that GitHub repository and deploy.
- In Vercel -> Project -> Settings -> Environment Variables, add all values from `.env.example`.
- Required: `DASHBOARD_PASSWORD`, `AUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `CRON_SECRET`, `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, `META_GRAPH_VERSION`.
- `GEMINI_API_KEY` is optional.
- Redeploy after adding/changing environment variables.

## 5) Cron
`vercel.json` does not define a cron. Vercel Hobby plan only allows daily cron jobs, so the 15-minute schedule must come from an external cron service (see below). Vercel sends `Authorization: Bearer <CRON_SECRET>` for protected cron jobs when configured in the project settings. If your Vercel plan does not support Cron, use an external cron service with:
`https://YOUR-DEPLOYMENT.vercel.app/api/cron?secret=YOUR_CRON_SECRET`
Do not expose this URL publicly.

## 6) Use
- Open your Vercel deployment URL.
- Sign in with `DASHBOARD_PASSWORD`.
- Check Trend Radar, select a topic, generate text, edit it, and create design.
- Add to queue. Review the post in Queue.
- To publish manually, press Publish Now.
- To automate scheduled queue publishing, enable Master Automation and Photo Automation, choose daily limit, and turn Approval OFF only after testing. With Approval ON, cron deliberately waits for manual approval; use Publish Now for reviewed posts.
- Schedule field uses your browser's local time. Set Bangladesh time on your phone.

## Troubleshooting
- "Supabase is not configured": check URL and service role key in Vercel env vars.
- Storage upload errors: check the `bct-memes` bucket exists and is public.
- "Meta Page ID/Token not configured": add both env vars and redeploy.
- Meta errors: verify Page token is valid, not expired, has Page publishing permission, and belongs to the intended Page.
- No trends: RSS source may be unavailable; try later or add public RSS URLs to `TREND_RSS_URLS` as comma-separated values.
- Cron not posting: automation/photo toggles must be ON; post must be due; approval must be OFF for unattended publishing; check Vercel Cron logs.

## Security
- Never commit `.env` or secret keys.
- Service role key must remain server-side only.
- Use a long unique dashboard password, `AUTH_SECRET`, and `CRON_SECRET`.
- Keep approval mode enabled until all tests pass.
