import OpenAI from "openai";

const PRODUCT_WHITELIST = [
  "asin",
  "title",
  "image",
  "url",
  "price",
  "rating",
  "reviewsCount",
  "prime",
  "availability",
];

function whitelist(products) {
  return products.map((p) => {
    const out = {};
    for (const k of PRODUCT_WHITELIST) if (p[k] !== undefined) out[k] = p[k];
    return out;
  });
}

export async function summarizeWithOpenAI(products, history, apiKey) {
  const safe = whitelist(products);
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content || "";

  if (!apiKey) {
    return safe.length
      ? `Here are some options:\n${safe.map((p) => `- ${p.title} (${p.price ?? "?"})`).join("\n")}`
      : "I could not find matching products.";
  }

  const client = new OpenAI({ apiKey });

  const system = `
You are a shopping assistant. ONLY use provided product fields.
If a field is missing, say you don't know. Do not invent prices or ratings.
Be helpful.`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system.trim() },
      { role: "user", content: lastUser },
      { role: "system", content: safe.length ? JSON.stringify(safe, null, 2) : "No products found." },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "I could not find matching products.";
}