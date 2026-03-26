import test from "node:test";
import assert from "node:assert/strict";
import { categorizeProduct, isEligibleMealProduct } from "../src/domain/categories.js";

test("categorizeProduct identifies protein items confidently", () => {
  const result = categorizeProduct({ name: "Chicken breast fillets", categoryHint: "" });
  assert.equal(result.category, "protein");
  assert.ok(result.confidence >= 0.75);
});

test("categorizeProduct rejects ambiguous products", () => {
  const result = categorizeProduct({ name: "Ready meal pasta bake", categoryHint: "" });
  assert.equal(result.category, "other");
  assert.ok(result.confidence < 0.75);
});

test("isEligibleMealProduct requires confident classified products", () => {
  assert.equal(
    isEligibleMealProduct({
      category: "carb",
      confidence: 0.8,
      price: 2.5
    }),
    true
  );

  assert.equal(
    isEligibleMealProduct({
      category: "other",
      confidence: 0.9,
      price: 2.5
    }),
    false
  );
});
