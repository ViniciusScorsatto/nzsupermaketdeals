import { Bot, webhookCallback } from "grammy";
import { buildMealResponse, buildPresetKeyboard, buildStartMessage, buildFeaturedMealResponse } from "./domain/formatter.js";
import { getPresetById } from "./domain/presets.js";
import { getStoreLabel, UploadSessionStore } from "./domain/upload-session.js";
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
  let activeUploadPromise = null;
  const uploadSessions = new UploadSessionStore();

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

  bot.command("upload_paknsave", async (ctx) => {
    if (!isAdmin(config, ctx.from?.id)) return;
    uploadSessions.start(ctx.chat.id, "paknsave");
    await ctx.reply("Pak'nSave upload started. Send one or more screenshots, then send /finish_upload.");
  });

  bot.command("upload_newworld", async (ctx) => {
    if (!isAdmin(config, ctx.from?.id)) return;
    uploadSessions.start(ctx.chat.id, "newworld");
    await ctx.reply("New World upload started. Send one or more screenshots, then send /finish_upload.");
  });

  bot.command("upload_woolworths", async (ctx) => {
    if (!isAdmin(config, ctx.from?.id)) return;
    uploadSessions.start(ctx.chat.id, "woolworths");
    await ctx.reply("Woolworths upload started. Send one or more screenshots, then send /finish_upload.");
  });

  bot.command("cancel_upload", async (ctx) => {
    if (!isAdmin(config, ctx.from?.id)) return;
    uploadSessions.clear(ctx.chat.id);
    await ctx.reply("Upload session cleared.");
  });

  bot.command("finish_upload", async (ctx) => {
    await logInteraction(pool, "command_finish_upload", {}, ctx);

    if (!isAdmin(config, ctx.from?.id)) {
      await ctx.reply("This command is only available to bot admins.");
      return;
    }

    const session = uploadSessions.get(ctx.chat.id);
    if (!session || !session.imageUrls.length) {
      await ctx.reply("No screenshots queued. Start with /upload_paknsave, /upload_newworld, or /upload_woolworths.");
      return;
    }

    if (activeUploadPromise) {
      await ctx.reply("An upload is already being processed. Please wait for it to finish.");
      return;
    }

    await ctx.reply(
      `Processing ${session.imageUrls.length} screenshot(s) for ${getStoreLabel(session.storeKey)}.`
    );

    const chatId = ctx.chat.id;
    const queuedSession = {
      ...session,
      imageUrls: [...session.imageUrls]
    };
    uploadSessions.clear(chatId);

    activeUploadPromise = (async () => {
      try {
        const result = await refreshDeals({
          mode: "screenshots",
          screenshotPayload: queuedSession
        });
        await bot.api.sendMessage(chatId, buildRefreshSummary(result));
      } catch (error) {
        console.error("Screenshot upload failed", error);
        await bot.api.sendMessage(chatId, `Screenshot processing failed.\n${error.message}`);
      } finally {
        activeUploadPromise = null;
      }
    })();
  });

  bot.on(["message:photo", "message:document"], async (ctx) => {
    if (!isAdmin(config, ctx.from?.id)) {
      return;
    }

    const session = uploadSessions.get(ctx.chat.id);
    if (!session) {
      return;
    }

    const fileId = ctx.message.photo?.at(-1)?.file_id ?? ctx.message.document?.file_id;
    if (!fileId) {
      return;
    }

    const file = await ctx.api.getFile(fileId);
    if (!file.file_path) {
      await ctx.reply("I could not read that image from Telegram.");
      return;
    }

    const imageUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;
    const updatedSession = uploadSessions.addImage(ctx.chat.id, imageUrl);
    await logInteraction(pool, "upload_screenshot_received", { storeKey: session.storeKey }, ctx);
    await ctx.reply(
      `${getStoreLabel(session.storeKey)} screenshot saved (${updatedSession.imageUrls.length} queued). Send more, or /finish_upload when ready.`
    );
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
