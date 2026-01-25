import express from "express";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";

import { config } from "./utils/config.js";
import { searchProducts } from "./services/rainforest.js";
import { summarizeWithOpenAI } from "./services/openai.js";

//Extracts search preferences from user queries then gives a sorted product list
function parseFiltersFromMessage(message) {
  const m = String(message || "").toLowerCase();
  const out = {};

  if (m.includes("best rated") || m.includes("highest rated")) out.sort_by = "featured"; // or whatever Rainforest supports
  if (m.includes("cheapest") || m.includes("lowest price")) out.sort_by = "price_low_to_high";
  if (m.includes("most expensive")) out.sort_by = "price_high_to_low";

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
