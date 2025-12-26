import express from "express";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";

import { config } from "./utils/config.js";
import { searchProducts } from "./services/rainforest.js";
import { summarizeWithOpenAI } from "./services/openai.js";


function parseFiltersFromMessage(message) {
  const m = String(message || "").toLowerCase();

  const out = {};

  // price: "under $50", "below 30", "less than 100"
  const priceMatch =
    m.match(/under\s*\$?\s*(\d{1,5})/) ||
    m.match(/below\s*\$?\s*(\d{1,5})/) ||
    m.match(/less\s+than\s*\$?\s*(\d{1,5})/);
  if (priceMatch) out.maxPrice = Number(priceMatch[1]);

  // rating: "4 stars", "4.5 star", "at least 4 stars"
  const ratingMatch =
    m.match(/at\s+least\s*(\d(?:\.\d)?)\s*stars?/) ||
    m.match(/(\d(?:\.\d)?)\s*stars?\s+and\s+up/) ||
    m.match(/(\d(?:\.\d)?)\s*stars?/);
  if (ratingMatch) out.minRating = Number(ratingMatch[1]);

  // prime only
  if (m.includes("prime only") || m.includes("prime-only") || m.includes("with prime")) out.prime = true;

  // sort preference
  if (m.includes("best rated") || m.includes("highest rated")) out.sort = "rating";
  if (m.includes("cheapest") || m.includes("lowest price")) out.sort = "price_asc";
  if (m.includes("most expensive")) out.sort = "price_desc";

  return out;
}

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 30,
  })
);

const memory = {};
function ensureConversation(conversationId) {
  const cid = conversationId || uuid();
  if (!memory[cid]) memory[cid] = { history: [] };
  return cid;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    message: "Server is running",
    env: config.env,
    checks: {
      openaiConfigured: Boolean(config.openaiApiKey),
      rainforestConfigured: Boolean(config.rainforestApiKey),
    },
  });
});

app.get("/compliance", (_req, res) => {
  res.json({
    affiliateNotice:
      "As an Amazon Associate I earn from qualifying purchases. Product data provided by Amazon.",
    priceDisclaimer:
      "Prices/availability accurate at time of query and may change.",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, filters = {}, conversationId } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const cid = ensureConversation(conversationId);
    memory[cid].history.push({ role: "user", content: message });

 
    const mergedFilters = { ...parseFiltersFromMessage(message), ...filters };

    const products = await searchProducts(message, mergedFilters);
    const assistantText = await summarizeWithOpenAI(
      products,
      memory[cid].history,
      config.openaiApiKey
    );

    memory[cid].history.push({ role: "assistant", content: assistantText });

    res.json({ assistantText, products, conversationId: cid });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
