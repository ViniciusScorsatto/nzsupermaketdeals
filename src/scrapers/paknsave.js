import { BaseStoreScraper } from "./base.js";

export class PaknSaveScraper extends BaseStoreScraper {
  async scrape() {
    const html = await this.fetchHtml();
    const $ = this.load(html);
    return this.scrapeLinkedProducts($);
  }
}
