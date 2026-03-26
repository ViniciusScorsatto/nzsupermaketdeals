import { BUDGET_PRESETS, getPresetById } from "../domain/presets.js";

export async function seedStores(pool) {
  const stores = [
    { key: "paknsave", name: "Pak'nSave" },
    { key: "newworld", name: "New World" },
    { key: "woolworths", name: "Woolworths" }
  ];

  for (const store of stores) {
    await pool.query(
      `
        INSERT INTO stores (key, name)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE
        SET name = EXCLUDED.name
      `,
      [store.key, store.name]
    );
  }
}

export async function createScrapeRun(pool) {
  const result = await pool.query(
    `
      INSERT INTO scrape_runs (status)
      VALUES ('running')
      RETURNING id
    `
  );

  return result.rows[0].id;
}

export async function completeScrapeRun(pool, scrapeRunId, summary, status = "success") {
  await pool.query(
    `
      UPDATE scrape_runs
      SET status = $2, completed_at = NOW(), summary = $3
      WHERE id = $1
    `,
    [scrapeRunId, status, JSON.stringify(summary)]
  );
}

export async function upsertProducts(pool, products, scrapeRunId) {
  const idMap = new Map();

  for (const product of products) {
    const result = await pool.query(
      `
        INSERT INTO products (
          external_id,
          store_key,
          store_name,
          name,
          price,
          url,
          category,
          confidence,
          classification_reason,
          category_hint,
          scrape_run_id,
          last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (external_id) DO UPDATE
        SET
          store_key = EXCLUDED.store_key,
          store_name = EXCLUDED.store_name,
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          url = EXCLUDED.url,
          category = EXCLUDED.category,
          confidence = EXCLUDED.confidence,
          classification_reason = EXCLUDED.classification_reason,
          category_hint = EXCLUDED.category_hint,
          scrape_run_id = EXCLUDED.scrape_run_id,
          last_seen_at = NOW()
        RETURNING id
      `,
      [
        product.externalId,
        product.storeKey,
        product.store,
        product.name,
        product.price,
        product.url,
        product.category,
        product.confidence,
        product.classificationReason,
        product.categoryHint ?? "",
        scrapeRunId
      ]
    );

    idMap.set(product.externalId, result.rows[0].id);
  }

  return idMap;
}

export async function replaceGeneratedMeals(pool, scrapeRunId, mealsByPreset) {
  await pool.query(`DELETE FROM generated_meals WHERE scrape_run_id = $1`, [scrapeRunId]);

  const storedMeals = [];

  for (const { preset, meals } of mealsByPreset) {
    for (const meal of meals) {
      const mealResult = await pool.query(
        `
          INSERT INTO generated_meals (
            preset_id,
            preset_label,
            title,
            total_price,
            budget,
            score,
            store_name,
            recipe_steps,
            scrape_run_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `,
        [
          preset.id,
          preset.label,
          meal.title,
          meal.totalPrice,
          preset.maxBudgetInclusive,
          meal.score,
          meal.store,
          JSON.stringify(meal.recipeSteps),
          scrapeRunId
        ]
      );

      storedMeals.push({
        ...meal,
        id: mealResult.rows[0].id,
        preset
      });
    }
  }

  return storedMeals;
}

export async function replaceMealIngredients(pool, meals, productIdMap) {
  for (const meal of meals) {
    for (const [index, ingredient] of meal.ingredients.entries()) {
      const productId = productIdMap.get(ingredient.externalId);
      if (!productId) {
        continue;
      }

      await pool.query(
        `
          INSERT INTO meal_ingredients (meal_id, product_id, sort_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (meal_id, product_id) DO UPDATE
          SET sort_order = EXCLUDED.sort_order
        `,
        [meal.id, productId, index]
      );
    }
  }
}

export async function replaceFeaturedMeal(pool, date, meal) {
  await pool.query(
    `
      INSERT INTO featured_meals (target_date, meal_id, preset_id, preset_label)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (target_date) DO UPDATE
      SET meal_id = EXCLUDED.meal_id,
          preset_id = EXCLUDED.preset_id,
          preset_label = EXCLUDED.preset_label
    `,
    [date, meal.id, meal.preset.id, meal.preset.label]
  );
}

export async function upsertTelegramUser(pool, from) {
  if (!from) {
    return;
  }

  await pool.query(
    `
      INSERT INTO users (telegram_user_id, username, first_name, last_name, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (telegram_user_id) DO UPDATE
      SET username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          updated_at = NOW()
    `,
    [from.id, from.username ?? null, from.first_name ?? null, from.last_name ?? null]
  );
}

export async function upsertTelegramChat(pool, chat) {
  if (!chat) {
    return;
  }

  await pool.query(
    `
      INSERT INTO chats (telegram_chat_id, type, title, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (telegram_chat_id) DO UPDATE
      SET type = EXCLUDED.type,
          title = EXCLUDED.title,
          updated_at = NOW()
    `,
    [chat.id, chat.type, chat.title ?? null]
  );
}

export async function logInteraction(pool, interactionType, payload = {}, ctx = {}) {
  await pool.query(
    `
      INSERT INTO bot_interactions (telegram_user_id, telegram_chat_id, interaction_type, payload)
      VALUES ($1, $2, $3, $4)
    `,
    [ctx.from?.id ?? null, ctx.chat?.id ?? null, interactionType, JSON.stringify(payload)]
  );
}

export async function getMealsForPreset(pool, presetId) {
  const preset = getPresetById(presetId);
  if (!preset) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT
        gm.id,
        gm.title,
        gm.total_price,
        gm.store_name,
        gm.recipe_steps,
        json_agg(
          json_build_object(
            'name', p.name,
            'price', p.price,
            'url', p.url,
            'externalId', p.external_id
          )
          ORDER BY mi.sort_order
        ) AS ingredients
      FROM generated_meals gm
      JOIN meal_ingredients mi ON mi.meal_id = gm.id
      JOIN products p ON p.id = mi.product_id
      WHERE gm.preset_id = $1
      GROUP BY gm.id
      ORDER BY gm.score ASC, gm.total_price ASC
      LIMIT 3
    `,
    [presetId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    totalPrice: Number(row.total_price),
    store: row.store_name,
    recipeSteps: row.recipe_steps,
    ingredients: row.ingredients.map((ingredient) => ({
      ...ingredient,
      price: Number(ingredient.price)
    }))
  }));
}

export async function getFeaturedMeal(pool) {
  const result = await pool.query(
    `
      SELECT
        gm.id,
        gm.title,
        gm.total_price,
        gm.store_name,
        gm.recipe_steps,
        fm.preset_label,
        json_agg(
          json_build_object(
            'name', p.name,
            'price', p.price,
            'url', p.url,
            'externalId', p.external_id
          )
          ORDER BY mi.sort_order
        ) AS ingredients
      FROM featured_meals fm
      JOIN generated_meals gm ON gm.id = fm.meal_id
      JOIN meal_ingredients mi ON mi.meal_id = gm.id
      JOIN products p ON p.id = mi.product_id
      WHERE fm.target_date = CURRENT_DATE
      GROUP BY gm.id, fm.preset_label
      LIMIT 1
    `
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    totalPrice: Number(row.total_price),
    store: row.store_name,
    recipeSteps: row.recipe_steps,
    presetLabel: row.preset_label,
    ingredients: row.ingredients.map((ingredient) => ({
      ...ingredient,
      price: Number(ingredient.price)
    }))
  };
}

export async function getBestFeaturedCandidate(pool) {
  const result = await pool.query(
    `
      SELECT id, preset_id, preset_label, score, total_price
      FROM generated_meals
      ORDER BY score ASC, total_price ASC
      LIMIT 1
    `
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    preset: {
      id: row.preset_id,
      label: row.preset_label
    }
  };
}

export { BUDGET_PRESETS };
