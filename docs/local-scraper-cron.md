# Local Scraper + Railway Postgres

Use this mode when the hosted Railway service can run the Telegram bot, but supermarket sites block scraping from Railway IPs.

## How it works

- Railway hosts the Telegram bot and Postgres
- Your own machine runs the scraper job
- The local job writes normalized products and generated meals into Railway Postgres
- The bot reads the latest generated meals from the database

## 1. Get the Railway Postgres connection string

In Railway:

1. Open the `Postgres` service
2. Open `Variables`
3. Copy the `DATABASE_URL` value

Set that same value in your local `.env`.

## 2. Local `.env`

Create a local `.env` based on `.env.example`.

Minimum fields for local scraping:

```env
APP_BASE_URL=https://nzsupermaketdeals-production.up.railway.app
DATABASE_URL=<your-railway-postgres-database-url>
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
TELEGRAM_WEBHOOK_SECRET=<your-webhook-secret>
TELEGRAM_ADMIN_IDS=5596433718
TELEGRAM_DAILY_CHAT_IDS=5596433718
TIMEZONE=Pacific/Auckland
PAKNSAVE_SPECIALS_URL=https://www.paknsave.co.nz/shop/deals?pg=1
NEW_WORLD_SPECIALS_URL=https://www.newworld.co.nz/shop/specials?pg=1
WOOLWORTHS_SPECIALS_URL=https://www.woolworths.co.nz/shop/specials
```

`OPENAI_API_KEY` is optional. If omitted, recipe generation falls back to template steps.

## 3. Check DB connectivity

```bash
npm run db:check
```

Expected result:

```json
{
  "ok": true
}
```

## 4. Run the scraper locally

```bash
npm run job:local
```

This will:

- fetch current specials from the configured stores
- classify products
- generate meals
- write everything into Railway Postgres
- optionally send the featured meal to `TELEGRAM_DAILY_CHAT_IDS`

## 5. Verify from Telegram

After a successful local refresh:

- open the bot
- run `/today`
- tap a budget button from `/start`

## macOS cron example

Open your crontab:

```bash
crontab -e
```

Example schedule for every day at `8:00 AM` Auckland time:

```cron
0 8 * * * cd "/Users/viniciusscorsatto/Desktop/AI Projects/NZ Supermarket Deals Bot" && /usr/local/bin/npm run job:local >> /tmp/nz-supermarket-deals-bot.log 2>&1
```

If your `npm` path is different, find it with:

```bash
which npm
```

## launchd alternative on macOS

If you want a more Mac-native scheduler later, prefer `launchd` over cron. Cron is enough for MVP validation.
