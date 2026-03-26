import { BaseStoreScraper } from "./base.js";
import { buildStoreSearchUrl } from "../utils/store-links.js";

export class WoolworthsScraper extends BaseStoreScraper {
  constructor({ apiUrl, ...options }) {
    super(options);
    this.apiUrl = apiUrl;
  }

  async scrape() {
    const response = await fetch(this.apiUrl, {
      headers: {
        "accept": "application/json",
        "accept-language": "en-NZ,en;q=0.9",
        "origin": this.specialsUrl,
        "referer": this.specialsUrl,
        "user-agent": this.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.storeName} specials: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products?.items ?? data.products?.products ?? [];
    const normalizedProducts = products
      .map((product) => {
        const name = product.name?.trim();
        const price = Number(product.price?.salePrice ?? product.price?.currentPrice ?? product.price?.originalPrice);
        if (!name || !Number.isFinite(price) || price <= 0) {
          return null;
        }

        return {
          externalId: `${this.storeKey}:${product.sku ?? product.barcode ?? name}`,
          store: this.storeName,
          storeKey: this.storeKey,
          name,
          price: Number(price.toFixed(2)),
          url: buildStoreSearchUrl(this.storeKey, name),
          categoryHint: product.department?.name ?? product.unit ?? ""
        };
      })
      .filter(Boolean);

    return {
      products: normalizedProducts,
      diagnostics: {
        apiProductCount: Array.isArray(products) ? products.length : 0,
        topLevelKeys: Object.keys(data).slice(0, 8),
        productKeys: products[0] ? Object.keys(products[0]).slice(0, 8) : []
      }
    };
  }
}
