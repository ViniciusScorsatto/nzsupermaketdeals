import { BaseStoreScraper } from "./base.js";

export class WoolworthsScraper extends BaseStoreScraper {
  async scrape() {
    const html = await this.fetchHtml();
    const $ = this.load(html);
    const products = [];

    $('[data-testid="product-tile"], .product-tile, article').each((_, element) => {
      const node = $(element);
      const name =
        node.find('[data-testid="product-title"], .product__title, .product-title').first().text().trim();
      const price =
        node.find('[data-testid="product-price"], .price, .price-dollars').first().text().trim();
      const url = node.find("a").first().attr("href");
      const categoryHint = node.closest("[data-category]").attr("data-category") ?? "";

      products.push({ name, price, url, categoryHint });
    });

    return this.normalizeProducts(products);
  }
}
