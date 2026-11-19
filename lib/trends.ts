import { XMLParser } from "fast-xml-parser";

const DEFAULT_FEEDS = [
  "https://trends.google.com/trending/rss?geo=BD",
  "https://www.bing.com/news/search?q=Bangladesh+viral+funny&format=rss"
];

export async function getTrends() {
  const custom = (process.env.TREND_RSS_URLS || "").split(",").map(s=>s.trim()).filter(Boolean);
  const feeds = custom.length ? custom : DEFAULT_FEEDS;
  const parser = new XMLParser({ ignoreAttributes: false });
  const results:any[] = [];
  for (const url of feeds) {
    try {
      const response = await fetch(url, { headers: { "User-Agent":"BCT-Viral-Studio/1.0" }, cache:"no-store", signal: AbortSignal.timeout(9000) });
      if (!response.ok) continue;
      const xml = await response.text();
      const parsed = parser.parse(xml);
      const channel = parsed?.rss?.channel;
      const items = Array.isArray(channel?.item) ? channel.item : channel?.item ? [channel.item] : [];
      for (const item of items.slice(0,15)) {
        const title = String(item.title || "").replace(/<[^>]*>/g,"").trim();
        if (title) results.push({ title, link: item.link || "", source: new URL(url).hostname, published: item.pubDate || "" });
      }
    } catch {}
  }
  const unique = Array.from(new Map(results.map(x=>[x.title.toLowerCase(),x])).values()).slice(0,30);
  return unique;
}
