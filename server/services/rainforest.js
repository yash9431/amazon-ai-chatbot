import { config } from "../utils/config.js";


const cache = new Map();         
const TTL_MS = 5 * 60 * 1000;    

export async function searchProducts(query, filters = {}) {
  if (!config.rainforestApiKey) {
    throw new Error("RAINFOREST_API_KEY missing");
  }

  const q = String(query || "").trim().toLowerCase() || "top tech gadgets";

 
  const now = Date.now();
  const hit = cache.get(q);
  if (hit && now - hit.ts < TTL_MS) return hit.data;

  const url = new URL("https://api.rainforestapi.com/request");
  url.searchParams.set("api_key", config.rainforestApiKey);
  url.searchParams.set("type", "search");
  url.searchParams.set("amazon_domain", "amazon.com");
  url.searchParams.set("search_term", q);

  if (filters.page) url.searchParams.set("page", String(filters.page));
  if (filters.sort_by) url.searchParams.set("sort_by", String(filters.sort_by));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Rainforest error: ${res.status}`);

  const data = await res.json();

  const products = (data.search_results || []).map(item => ({
    asin: item.asin,
    title: item.title,
    image: item.image,
    url: item.link, 
    price: item.price?.raw ?? (item.price?.value != null ? `$${item.price.value}` : null),
    currency: item.price?.currency ?? "USD",
    rating: item.rating ?? null,
    reviewsCount: item.reviews_count ?? null,
    prime: !!item.is_prime,
    availability: item.availability?.raw || "—"
  }));

  cache.set(q, { ts: now, data: products });
  return products;
}
