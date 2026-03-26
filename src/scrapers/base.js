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

  findLikelyProductContainer($, element) {
    let current = $(element);

    for (let depth = 0; depth < 6 && current.length; depth += 1) {
      const text = current.text().replace(/\s+/g, " ").trim();
      if (/\bAdd\b/i.test(text) && /\bea\b/i.test(text)) {
        return current;
      }
      current = current.parent();
    }

    return $(element).parent();
  }

  extractPriceFromText(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    const multiBuyMatch = normalized.match(/(\d+)\s+for\s+(\d+)\.(\d{2})/i);
    if (multiBuyMatch) {
      const quantity = Number(multiBuyMatch[1]);
      const total = Number(`${multiBuyMatch[2]}.${multiBuyMatch[3]}`);
      return Number((total / quantity).toFixed(2));
    }

    const unitMatch = normalized.match(/(\d+)\s*\.\s*(\d{2})\s*(?:ea\b|$)/i);
    if (unitMatch) {
      return Number(`${unitMatch[1]}.${unitMatch[2]}`);
    }

    const splitMatch = normalized.match(/(?:^|\s)(\d+)\s+(\d{2})\s+ea\b/i);
    if (splitMatch) {
      return Number(`${splitMatch[1]}.${splitMatch[2]}`);
    }

    return parsePrice(normalized);
  }

  scrapeLinkedProducts($) {
    const seen = new Set();
    const products = [];

    $('a[href*="/shop/product/"]').each((_, element) => {
      const anchor = $(element);
      const name = anchor.text().replace(/\s+/g, " ").trim();
      const url = anchor.attr("href");

      if (!name || !url || seen.has(url)) {
        return;
      }

      const container = this.findLikelyProductContainer($, element);
      const containerText = container.text().replace(/\s+/g, " ").trim();
      const price = this.extractPriceFromText(containerText);

      if (!price) {
        return;
      }

      seen.add(url);
      products.push({
        name,
        price,
        url,
        categoryHint: containerText
      });
    });

    return this.normalizeProducts(products);
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
