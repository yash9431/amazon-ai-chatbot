import "dotenv/config";

function requireEnv(name, fallback) {
  const val = process.env[name];
  if (!val && fallback === undefined) {
    console.warn(`Missing env var: ${name}`);
  }
  return val || fallback;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(requireEnv("PORT", 5174)),

  openaiApiKey: process.env.OPENAI_API_KEY || "",
  
  rainforestApiKey: process.env.RAINFOREST_API_KEY || "",
  productsProvider: process.env.PRODUCTS_PROVIDER || "rainforest",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};