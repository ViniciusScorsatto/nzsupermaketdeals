export async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scrape_runs (
      id BIGSERIAL PRIMARY KEY,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'running',
      summary JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      external_id TEXT NOT NULL UNIQUE,
      store_key TEXT NOT NULL,
      store_name TEXT NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      confidence NUMERIC(4, 2) NOT NULL,
      classification_reason TEXT NOT NULL,
      category_hint TEXT NOT NULL DEFAULT '',
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      scrape_run_id BIGINT REFERENCES scrape_runs(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS generated_meals (
      id BIGSERIAL PRIMARY KEY,
      preset_id TEXT NOT NULL,
      preset_label TEXT NOT NULL,
      title TEXT NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      budget NUMERIC(10, 2) NOT NULL,
      score NUMERIC(10, 4) NOT NULL,
      store_name TEXT NOT NULL,
      recipe_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      scrape_run_id BIGINT REFERENCES scrape_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_ingredients (
      meal_id BIGINT NOT NULL REFERENCES generated_meals(id) ON DELETE CASCADE,
      product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (meal_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS featured_meals (
      id BIGSERIAL PRIMARY KEY,
      target_date DATE NOT NULL UNIQUE,
      meal_id BIGINT NOT NULL REFERENCES generated_meals(id) ON DELETE CASCADE,
      preset_id TEXT NOT NULL,
      preset_label TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      telegram_user_id BIGINT NOT NULL UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      is_premium BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chats (
      id BIGSERIAL PRIMARY KEY,
      telegram_chat_id BIGINT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      title TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bot_interactions (
      id BIGSERIAL PRIMARY KEY,
      telegram_user_id BIGINT,
      telegram_chat_id BIGINT,
      interaction_type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
