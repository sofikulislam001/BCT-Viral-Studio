// Background image generation with Gemini ("Nano Banana" image models).
// Text is NOT drawn by the model; Bangla headline/subtext are overlaid by the app.
// Returns null on any failure so callers can fall back to the plain design.

export async function generateBackgroundPng(topic: string): Promise<Buffer | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const prompt =
    `Abstract, colourful, cartoon-style square background for a funny Bangladeshi social media meme about "${topic}". ` +
    `No text, no letters, no logos, no watermarks, no human faces. Leave the centre area calm and less busy so text can be placed on top.`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts || [];
    for (const p of parts) {
      const data = p?.inlineData?.data;
      if (data) return Buffer.from(data, "base64");
    }
    return null;
  } catch {
    return null;
  }
}
