//this is optional
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

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        //Telling the system how to respond to the user based on the provided product data  
        content: "Summarize the provided product list for the user's query. Use only the provided fields. If a field is missing, state that it is unavailable. Do not invent prices, ratings, or availability.",
      },
      { role: "user", content: JSON.stringify(input) },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "I could not find matching products.";
}