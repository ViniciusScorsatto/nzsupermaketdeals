import { processDealProducts } from "./deal-processing-service.js";

export async function refreshDeals({
  pool,
  scrapers,
  recipeService,
  timezone
}) {
  const productsBySource = {};
  const sourceDiagnostics = {};

  for (const scraper of scrapers) {
    try {
      const result = await scraper.scrape();
      if (Array.isArray(result)) {
        productsBySource[scraper.storeKey] = result;
        sourceDiagnostics[scraper.storeKey] = {
          returnedArray: true,
          rawCount: result.length
        };
      } else {
        productsBySource[scraper.storeKey] = result.products ?? [];
        sourceDiagnostics[scraper.storeKey] = result.diagnostics ?? {
          returnedArray: false
        };
      }
    } catch (error) {
      productsBySource[scraper.storeKey] = [];
      sourceDiagnostics[scraper.storeKey] = {
        error: error.message
      };
    }
  }

  const processed = await processDealProducts({
    pool,
    recipeService,
    timezone,
    productsBySource
  });

  for (const [storeKey, diagnostics] of Object.entries(sourceDiagnostics)) {
    processed.summary.stores[storeKey] = {
      ...processed.summary.stores[storeKey],
      diagnostics
    };
  }

  return processed;
}
