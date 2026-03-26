import { PaknSaveScraper } from "./paknsave.js";
import { NewWorldScraper } from "./newworld.js";
import { WoolworthsScraper } from "./woolworths.js";

export function buildScrapers({ storeUrls, storeApis, userAgent }) {
  return [
    new PaknSaveScraper({
      specialsUrl: storeUrls.paknsave,
      apiUrl: storeApis.paknsave.url,
      storeId: storeApis.paknsave.storeId,
      userAgent
    }),
    new NewWorldScraper({
      specialsUrl: storeUrls.newworld,
      apiUrl: storeApis.newworld.url,
      storeId: storeApis.newworld.storeId,
      userAgent
    }),
    new WoolworthsScraper({
      storeKey: "woolworths",
      storeName: "Woolworths",
      specialsUrl: storeUrls.woolworths,
      apiUrl: storeApis.woolworths.url,
      userAgent
    })
  ];
}
