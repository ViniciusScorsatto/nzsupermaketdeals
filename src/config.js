import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCsv(value) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  appBaseUrl: required("APP_BASE_URL"),
  databaseUrl: required("DATABASE_URL"),
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  telegramWebhookSecret: required("TELEGRAM_WEBHOOK_SECRET"),
  telegramAdminIds: parseCsv(process.env.TELEGRAM_ADMIN_IDS).map(Number),
  telegramDailyChatIds: parseCsv(process.env.TELEGRAM_DAILY_CHAT_IDS).map(Number),
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  timezone: process.env.TIMEZONE ?? "Pacific/Auckland",
  scrapeUserAgent:
    process.env.SCRAPE_USER_AGENT ??
    "Mozilla/5.0 (compatible; NZDealsBot/0.1; +https://example.com/bot)",
  storeApis: {
    paknsave: {
      url:
        process.env.PAKNSAVE_API_URL ??
        "https://api-prod.paknsave.co.nz/v1/edge/search/paginated/products",
      storeId:
        process.env.PAKNSAVE_STORE_ID ??
        "e1925ea7-01bc-4358-ae7c-c6502da5ab12",
      promotionFilter:
        process.env.PAKNSAVE_PROMOTION_FILTER ??
        "stores:e1925ea7-01bc-4358-ae7c-c6502da5ab12 AND onPromotion:e1925ea7-01bc-4358-ae7c-c6502da5ab12"
    },
    newworld: {
      url:
        process.env.NEW_WORLD_API_URL ??
        "https://api-prod.newworld.co.nz/v1/edge/search/paginated/products",
      storeId:
        process.env.NEW_WORLD_STORE_ID ??
        "60928d93-06fa-4d8f-92a6-8c359e7e846d",
      promotionFilter:
        process.env.NEW_WORLD_PROMOTION_FILTER ??
        "stores:60928d93-06fa-4d8f-92a6-8c359e7e846d AND onPromotion:60928d93-06fa-4d8f-92a6-8c359e7e846d"
    },
    woolworths: {
      url:
        process.env.WOOLWORTHS_API_URL ??
        "https://www.woolworths.co.nz/api/v1/products?target=specials&useRankedSpecials=true&page=1&pageSize=48"
    }
  },
  storeUrls: {
    paknsave: process.env.PAKNSAVE_SPECIALS_URL ?? "",
    newworld: process.env.NEW_WORLD_SPECIALS_URL ?? "",
    woolworths: process.env.WOOLWORTHS_SPECIALS_URL ?? ""
  }
};
