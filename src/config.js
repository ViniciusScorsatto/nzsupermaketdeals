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
  storeUrls: {
    paknsave: process.env.PAKNSAVE_SPECIALS_URL ?? "",
    newworld: process.env.NEW_WORLD_SPECIALS_URL ?? "",
    woolworths: process.env.WOOLWORTHS_SPECIALS_URL ?? ""
  }
};
