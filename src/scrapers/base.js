import * as cheerio from "cheerio";
import { slugify, parsePrice } from "../utils/text.js";

export class BaseStoreScraper {
  constructor({ storeKey, storeName, specialsUrl, userAgent }) {
    this.storeKey = storeKey;
    this.storeName = storeName;
    this.specialsUrl = specialsUrl;
    this.userAgent = userAgent;
  }

  async fetchHtml() {
    if (!this.specialsUrl) {
      throw new Error(`Missing specials URL for ${this.storeName}`);
    }

    const response = await fetch(this.specialsUrl, {
      headers: {
        "user-agent": this.userAgent,
        "accept-language": "en-NZ,en;q=0.9"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.storeName} specials: ${response.status}`);
    }

    return response.text();
  }

  load(html) {
    return cheerio.load(html);
  }

  normalizeProducts(rawProducts) {
    return rawProducts
      .map((product) => {
        const name = product.name?.trim();
        const price = typeof product.price === "number" ? product.price : parsePrice(product.price ?? "");
        const url = product.url?.startsWith("http")
          ? product.url
          : new URL(product.url ?? "", this.specialsUrl).toString();

        if (!name || !price || !url) {
          return null;
        }

        return {
          externalId: `${this.storeKey}:${slugify(name)}:${price}`,
          store: this.storeName,
          storeKey: this.storeKey,
          name,
          price,
          url,
          categoryHint: product.categoryHint ?? ""
        };
      })
      .filter(Boolean);
  }
}
