import test from "node:test";
import assert from "node:assert/strict";
import { buildMealResponse } from "../src/domain/formatter.js";

test("buildMealResponse renders links, totals, and steps", () => {
  const output = buildMealResponse(
    { id: "under_10", label: "Under $10", budget: 10 },
    [
      {
        title: "Chicken Rice Bowl",
        totalPrice: 8.7,
        store: "Pak'nSave",
        recipeSteps: ["Cook rice", "Cook chicken", "Serve with carrots"],
        ingredients: [
          { name: "Chicken", price: 4.5, url: "https://example.com/chicken" },
          { name: "Rice", price: 2.0, url: "https://example.com/rice" },
          { name: "Carrots", price: 2.2, url: "https://example.com/carrots" }
        ]
      }
    ]
  );

  assert.match(output, /Under \$10/);
  assert.match(output, /<a href="https:\/\/example.com\/chicken">Chicken<\/a>/);
  assert.match(output, /1\. Cook rice/);
});
