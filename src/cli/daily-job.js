import { config } from "../config.js";
import { createPool } from "../db/client.js";
import { ensureSchema } from "../db/schema.js";
import { seedStores, getFeaturedMeal } from "../db/repositories.js";
import { RecipeService } from "../domain/recipe-service.js";
import { buildScrapers } from "../scrapers/index.js";
import { refreshDeals } from "../services/refresh-service.js";
import { Bot } from "grammy";
import { buildFeaturedMealResponse } from "../domain/formatter.js";

const pool = createPool(config.databaseUrl);

await ensureSchema(pool);
await seedStores(pool);

const recipeService = new RecipeService({
  apiKey: config.openAiApiKey,
  model: config.openAiModel
});

const scrapers = buildScrapers({
  storeUrls: config.storeUrls,
  userAgent: config.scrapeUserAgent
});

const result = await refreshDeals({
  pool,
  scrapers,
  recipeService,
  timezone: config.timezone
});

if (config.telegramDailyChatIds.length) {
  const bot = new Bot(config.telegramBotToken);
  const featuredMeal = await getFeaturedMeal(pool);

  if (featuredMeal) {
    for (const chatId of config.telegramDailyChatIds) {
      await bot.api.sendMessage(chatId, buildFeaturedMealResponse(featuredMeal), {
        parse_mode: "HTML",
        disable_web_page_preview: true
      });
    }
  }
}

console.log(JSON.stringify(result.summary, null, 2));
await pool.end();
