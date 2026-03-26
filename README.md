# NZ Supermarket Meals Bot

Hosted `Node.js` Telegram bot for affordable NZ supermarket meal ideas, designed for `Railway` + `Postgres`.

## What it does

- Scrapes specials from `Pak'nSave`, `New World`, and `Woolworths`
- Normalizes products into shared categories: `protein`, `carb`, `vegetable`, `other`
- Builds conservative `1 protein + 1 carb + 1 vegetable` meal combinations
- Ranks meals for `Under $10`, `Under $15`, `Under $20`, and `Under $25`
- Serves users through Telegram with a webhook-based bot
- Precomputes a daily featured meal and supports admin refresh commands

## Quick start

1. Copy `.env.example` to `.env` and fill in credentials.
2. Install dependencies:

```bash
npm install
```

3. Start the web service locally:

```bash
npm run start
```

4. Register the Telegram webhook after your app is reachable:

```bash
npm run webhook:register
```

5. Run a one-off refresh job:

```bash
npm run job:daily
```

## Railway deployment

- Deploy this repo as a `Node.js` service on `Railway`
- Add a `Postgres` service and set `DATABASE_URL`
- Configure:
  - `APP_BASE_URL`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_SECRET`
  - `OPENAI_API_KEY` if you want AI recipes
- Run `npm run webhook:register` once after the service URL is live
- Create a Railway cron job that runs `npm run job:daily`

## Admin commands

- `/start` shows budget presets
- `/today` shows the featured daily meal
- `/refresh_deals` refreshes product data and regenerates meals for admins only

## Notes

- The scraper selectors are heuristic and intentionally isolated per store.
- If a store parser fails, other stores can still produce meals.
- If `OPENAI_API_KEY` is missing, recipe generation falls back to deterministic template steps.
