import { config } from "../config.js";
import { Bot } from "grammy";

const bot = new Bot(config.telegramBotToken);
const webhookUrl = `${config.appBaseUrl}/telegram/${config.telegramWebhookSecret}`;

await bot.api.setWebhook(webhookUrl, {
  secret_token: config.telegramWebhookSecret,
  drop_pending_updates: false
});

console.log(`Webhook registered: ${webhookUrl}`);
