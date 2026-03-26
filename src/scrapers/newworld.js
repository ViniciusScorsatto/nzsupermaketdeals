import { BaseStoreScraper } from "./base.js";

export class NewWorldScraper extends BaseStoreScraper {
  async scrape() {
    const html = await this.fetchHtml();
    const $ = this.load(html);
    const products = [];

    $('[data-testid="product-card"], .product-tile, .js-product-card').each((_, element) => {
      const node = $(element);
      const name =
        node.find('[data-testid="product-title"], .product-tile__title, .product-name').first().text().trim();
      const price =
        node.find('[data-testid="price-dollars"], .price, .product-price').first().text().trim();
      const url = node.find("a").first().attr("href");
      const categoryHint = node.closest("[data-category]").attr("data-category") ?? "";

      products.push({ name, price, url, categoryHint });
    });

    return this.normalizeProducts(products);
  }
}
