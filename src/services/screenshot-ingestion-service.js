import OpenAI from "openai";

const STORE_META = {
  paknsave: {
    store: "Pak'nSave",
    specialsUrl: "https://www.paknsave.co.nz/shop/deals?pg=1"
  },
  newworld: {
    store: "New World",
    specialsUrl: "https://www.newworld.co.nz/shop/specials?pg=1"
  },
  woolworths: {
    store: "Woolworths",
    specialsUrl: "https://www.woolworths.co.nz/shop/specials"
  }
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractJson(text) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : text;
  return JSON.parse(candidate);
}

export class ScreenshotIngestionService {
  constructor({ apiKey, model }) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model = model;
  }

  ensureConfigured() {
    if (!this.client) {
      throw new Error("Screenshot ingestion requires OPENAI_API_KEY.");
    }
  }

  async extractProductsFromImages({ storeKey, imageUrls }) {
    this.ensureConfigured();

    const storeMeta = STORE_META[storeKey];
    if (!storeMeta) {
      throw new Error(`Unsupported store: ${storeKey}`);
    }

    const input = [
      {
        role: "system",
        content:
          "You extract supermarket specials from screenshots. Return only valid JSON as an array. Each item must be {\"name\": string, \"price\": number}. Ignore loyalty banners, ads, savings text, and products without a clearly visible price."
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `These screenshots are from ${storeMeta.store} specials. Extract every product deal you can read clearly. Return JSON only.`
          },
          ...imageUrls.map((imageUrl) => ({
            type: "input_image",
            image_url: imageUrl
          }))
        ]
      }
    ];

    const response = await this.client.responses.create({
      model: this.model,
      input
    });

    const parsed = extractJson(response.output_text?.trim() ?? "[]");
    if (!Array.isArray(parsed)) {
      throw new Error("Vision extraction did not return an array.");
    }

    const deduped = new Map();
    for (const item of parsed) {
      const name = item?.name?.trim();
      const price = Number(item?.price);
      if (!name || !Number.isFinite(price) || price <= 0) {
        continue;
      }

      const key = `${slugify(name)}:${price.toFixed(2)}`;
      deduped.set(key, {
        externalId: `${storeKey}:manual:${key}`,
        store: storeMeta.store,
        storeKey,
        name,
        price: Number(price.toFixed(2)),
        url: storeMeta.specialsUrl,
        categoryHint: "screenshot-upload"
      });
    }

    return [...deduped.values()];
  }
}
