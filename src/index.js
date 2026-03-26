import { config } from "./config.js";
import { createPool } from "./db/client.js";
import { ensureSchema } from "./db/schema.js";
import { seedStores } from "./db/repositories.js";
import { RecipeService } from "./domain/recipe-service.js";
import { buildScrapers } from "./scrapers/index.js";
import { refreshDeals } from "./services/refresh-service.js";
import { ScreenshotIngestionService } from "./services/screenshot-ingestion-service.js";
import { processDealProducts } from "./services/deal-processing-service.js";
import { createApp } from "./app.js";

const pool = createPool(config.databaseUrl);

await ensureSchema(pool);
await seedStores(pool);

const recipeService = new RecipeService({
  apiKey: config.openAiApiKey,
  model: config.openAiModel
});
const screenshotIngestionService = new ScreenshotIngestionService({
  apiKey: config.openAiApiKey,
  model: config.openAiModel
});

const scrapers = buildScrapers({
  storeUrls: config.storeUrls,
  storeApis: config.storeApis,
  userAgent: config.scrapeUserAgent
});

const appRefresh = async ({ mode = "scrape", screenshotPayload } = {}) => {
  if (mode === "screenshots") {
    const products = await screenshotIngestionService.extractProductsFromImages({
      storeKey: screenshotPayload.storeKey,
      imageUrls: screenshotPayload.imageUrls
    });

    return processDealProducts({
      pool,
      recipeService,
      timezone: config.timezone,
      productsBySource: {
        [screenshotPayload.storeKey]: products
      }
    });
  }

  return refreshDeals({
    pool,
    scrapers,
    recipeService,
    timezone: config.timezone
  });
};

const { app, bot } = createApp({
  config,
  pool,
  refreshDeals: appRefresh
});

app.listen(config.port, async () => {
  await bot.init();
  console.log(`Server listening on port ${config.port}`);
});
