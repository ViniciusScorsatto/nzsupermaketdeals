import { FoodstuffsApiScraper } from "./shared-foodstuffs.js";

export class NewWorldScraper extends FoodstuffsApiScraper {
  constructor(options) {
    super({
      ...options,
      storeKey: "newworld",
      storeName: "New World"
    });
  }
}
