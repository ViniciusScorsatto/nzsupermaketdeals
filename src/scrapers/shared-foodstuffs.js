import { BaseStoreScraper } from "./base.js";
import { buildStoreSearchUrl } from "../utils/store-links.js";

function centsToDollars(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number((amount / 100).toFixed(2));
}

export class FoodstuffsApiScraper extends BaseStoreScraper {
  constructor({ apiUrl, storeId, promotionFilter, ...options }) {
    super(options);
    this.apiUrl = apiUrl;
    this.storeId = storeId;
    this.promotionFilter = promotionFilter;
  }

  buildPayload() {
    return {
      algoliaFacetQueries: [],
      algoliaQuery: {
        analyticsTags: ["fs#WEB:desktop"],
        attributesToHighlight: [],
        attributesToRetrieve: [
          "productId",
          "name",
          "brand",
          "displayName",
          "singlePrice",
          "promotions",
          "categoryTrees",
          "productFacets"
        ],
        filters: this.promotionFilter,
        facets: ["brand", "category0NI", "category1NI", "productFacets", "tobacco"],
        hitsPerPage: 50,
        maxValuesPerFacet: 100,
        page: 0
      },
      hitsPerPage: 50,
      page: 0,
      precisionMedia: {
        adDomain: "CATEGORY_PAGE",
        adPositions: [4, 8, 12],
        publishImpressionEvent: false,
        disableAds: true
      },
      sortOrder: "NI_POPULARITY_ASC",
      storeId: this.storeId,
      tobaccoQuery: false
    };
  }

  async scrape() {
    if (!this.apiUrl || !this.storeId) {
      throw new Error(`Missing API configuration for ${this.storeName}`);
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "origin": this.specialsUrl,
        "referer": this.specialsUrl,
        "accept-language": "en-NZ,en;q=0.9",
        "user-agent": this.userAgent
      },
      body: JSON.stringify(this.buildPayload())
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.storeName} specials: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products ?? [];

    return products
      .map((product) => {
        const name = product.name?.trim();
        const price = centsToDollars(product.singlePrice?.price);
        if (!name || !price) {
          return null;
        }

        return {
          externalId: `${this.storeKey}:${product.productId}`,
          store: this.storeName,
          storeKey: this.storeKey,
          name,
          price,
          url: buildStoreSearchUrl(this.storeKey, name),
          categoryHint:
            product.categoryTrees?.map((tree) => tree.level0 ?? "").join(" ") ??
            product.productFacets?.map((facet) => facet?.name ?? "").join(" ") ??
            ""
        };
      })
      .filter(Boolean);
  }
}
