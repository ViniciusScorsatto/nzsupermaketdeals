import { FoodstuffsApiScraper } from "./shared-foodstuffs.js";

export class PaknSaveScraper extends FoodstuffsApiScraper {
  constructor(options) {
    super({
      ...options,
      storeKey: "paknsave",
      storeName: "Pak'nSave"
    });
  }
}
