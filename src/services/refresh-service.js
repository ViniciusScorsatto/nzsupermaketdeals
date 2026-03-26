import { processDealProducts } from "./deal-processing-service.js";

export async function refreshDeals({
  pool,
  scrapers,
  recipeService,
  timezone
}) {
  const productsBySource = {};

  for (const scraper of scrapers) {
    try {
      productsBySource[scraper.storeKey] = await scraper.scrape();
    } catch (error) {
      productsBySource[scraper.storeKey] = [];
    }
  }

  return processDealProducts({
    pool,
    recipeService,
    timezone,
    productsBySource
  });
}
