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

function buildRefreshSummary(result) {
  const lines = [
    "Refresh complete.",
    `Products processed: ${result.summary.productsProcessed}`,
    `Meals generated: ${result.summary.mealsGenerated}`
  ];

  for (const [storeKey, storeSummary] of Object.entries(result.summary.stores ?? {})) {
    if (storeSummary.status === "success") {
      lines.push(
        `${storeKey}: raw ${storeSummary.rawProductsFound}, eligible ${storeSummary.eligibleProductsFound}`
      );
    } else {
      lines.push(`${storeKey}: error - ${storeSummary.message}`);
    }
  }

  return lines.join("\n");
}

export function createBot({ config, pool, refreshDeals }) {
  const bot = new Bot(config.telegramBotToken);
  let activeRefreshPromise = null;

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

    if (activeRefreshPromise) {
      await ctx.reply("A refresh is already running. I will send the summary here when it finishes.");
      return;
    }

    await ctx.reply("Refreshing deals and rebuilding meals. This can take a moment.");

    const chatId = ctx.chat?.id;
    activeRefreshPromise = (async () => {
      try {
        const result = await refreshDeals();

        if (chatId) {
          await bot.api.sendMessage(chatId, buildRefreshSummary(result));
        }
      } catch (error) {
        console.error("Refresh job failed", error);

        if (chatId) {
          await bot.api.sendMessage(
            chatId,
            `Refresh failed.\n${error.message}`
          );
        }
      } finally {
        activeRefreshPromise = null;
      }
    })();
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
    callback: webhookCallback(bot, "express", {
      onTimeout: "return",
      timeoutMilliseconds: 10_000,
      secretToken: config.telegramWebhookSecret
    })
  };
}
