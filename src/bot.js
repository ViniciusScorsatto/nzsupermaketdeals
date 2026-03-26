import { Bot, webhookCallback } from "grammy";
import { buildMealResponse, buildPresetKeyboard, buildStartMessage, buildFeaturedMealResponse } from "./domain/formatter.js";
import { getPresetById } from "./domain/presets.js";
import {
  getFeaturedMeal,
  getMealsForPreset,
  logInteraction,
  upsertTelegramChat,
  upsertTelegramUser
} from "./db/repositories.js";

function isAdmin(config, userId) {
  return config.telegramAdminIds.includes(Number(userId));
}

export function createBot({ config, pool, refreshDeals }) {
  const bot = new Bot(config.telegramBotToken);

  bot.use(async (ctx, next) => {
    await upsertTelegramUser(pool, ctx.from);
    await upsertTelegramChat(pool, ctx.chat);
    await next();
  });

  bot.command("start", async (ctx) => {
    await logInteraction(pool, "command_start", {}, ctx);
    await ctx.reply(buildStartMessage(), {
      reply_markup: buildPresetKeyboard()
    });
  });

  bot.command("today", async (ctx) => {
    await logInteraction(pool, "command_today", {}, ctx);
    const featuredMeal = await getFeaturedMeal(pool);
    await ctx.reply(buildFeaturedMealResponse(featuredMeal), {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  });

  bot.command("refresh_deals", async (ctx) => {
    await logInteraction(pool, "command_refresh", {}, ctx);

    if (!isAdmin(config, ctx.from?.id)) {
      await ctx.reply("This command is only available to bot admins.");
      return;
    }

    await ctx.reply("Refreshing deals and rebuilding meals. This can take a moment.");
    const result = await refreshDeals();
    await ctx.reply(`Refresh complete.\nProducts processed: ${result.summary.productsProcessed}\nMeals generated: ${result.summary.mealsGenerated}`);
  });

  bot.callbackQuery(/^preset:(.+)$/, async (ctx) => {
    const presetId = ctx.match[1];
    const preset = getPresetById(presetId);

    await logInteraction(pool, "preset_selected", { presetId }, ctx);
    await ctx.answerCallbackQuery();

    if (!preset) {
      await ctx.reply("That budget option is not available.");
      return;
    }

    const meals = await getMealsForPreset(pool, preset.id);
    await ctx.reply(buildMealResponse(preset, meals), {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  });

  bot.catch(async (error) => {
    console.error("Telegram bot error", error.error);
  });

  return {
    bot,
    callback: webhookCallback(bot, "express")
  };
}
