import express from "express";
import { createBot } from "./bot.js";
import { getFeaturedMeal } from "./db/repositories.js";

export function createApp({ config, pool, refreshDeals }) {
  const app = express();
  const { bot, callback } = createBot({ config, pool, refreshDeals });

  app.get("/health", async (_req, res) => {
    const featuredMeal = await getFeaturedMeal(pool);
    res.json({
      ok: true,
      featuredMealReady: Boolean(featuredMeal)
    });
  });

  app.use(express.json());
  app.post(`/telegram/${config.telegramWebhookSecret}`, callback);

  return { app, bot };
}
