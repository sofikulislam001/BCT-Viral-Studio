export async function makeCaption(topic:string) {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const prompt = `তুমি বাংলাদেশের জন্য একটি বাংলা meme page-এর কনটেন্ট রাইটার। বিষয়: "${topic}"। ১) ছোট, মজার, মৌলিক meme text ২) Facebook caption ৩) ৩-৫টি hashtag তৈরি করো। অপমান, ঘৃণা, ভুয়া খবর বা ব্যক্তিগত আক্রমণ নয়। JSON দাও: {"headline":"...","subtext":"...","caption":"...","hashtags":["..."]}`;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.9}})
      });
      if (r.ok) {
        const j = await r.json();
        const raw = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      }
    } catch {}
  }
  const clean = topic.trim().slice(0,100) || "আজকের জীবন";
  return {
    headline: clean,
    subtext: "এই পরিস্থিতিতে আমিই শুধু এমন নাকি? 😂",
    caption: `${clean} নিয়ে আর কিছু বলার নাই! 😂 আপনার বন্ধুকে মেনশন দিন।`,
    hashtags:["#BanglaMeme","#BCTViralStudio","#বাংলামিম"]
  };
}
