import { PaknSaveScraper } from "./paknsave.js";
import { NewWorldScraper } from "./newworld.js";
import { WoolworthsScraper } from "./woolworths.js";

export function buildScrapers({ storeUrls, userAgent }) {
  return [
    new PaknSaveScraper({
      storeKey: "paknsave",
      storeName: "Pak'nSave",
      specialsUrl: storeUrls.paknsave,
      userAgent
    }),
    new NewWorldScraper({
      storeKey: "newworld",
      storeName: "New World",
      specialsUrl: storeUrls.newworld,
      userAgent
    }),
    new WoolworthsScraper({
      storeKey: "woolworths",
      storeName: "Woolworths",
      specialsUrl: storeUrls.woolworths,
      userAgent
    })
  ];
}
