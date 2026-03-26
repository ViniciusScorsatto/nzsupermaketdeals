import test from "node:test";
import assert from "node:assert/strict";
import { generateMeals } from "../src/domain/meal-engine.js";

const products = [
  { externalId: "p1", store: "Pak'nSave", category: "protein", name: "Chicken thighs", price: 4.2, url: "https://example.com/p1" },
  { externalId: "c1", store: "Pak'nSave", category: "carb", name: "Rice", price: 1.9, url: "https://example.com/c1" },
  { externalId: "v1", store: "Pak'nSave", category: "vegetable", name: "Carrots", price: 1.2, url: "https://example.com/v1" },
  { externalId: "p2", store: "Pak'nSave", category: "protein", name: "Beef mince", price: 6.8, url: "https://example.com/p2" },
  { externalId: "v2", store: "Pak'nSave", category: "vegetable", name: "Broccoli", price: 2.3, url: "https://example.com/v2" }
];

test("generateMeals respects the selected budget", () => {
  const meals = generateMeals(products, {
    id: "under_10",
    label: "Under $10",
    minBudgetExclusive: 0,
    maxBudgetInclusive: 10
  });
  assert.ok(meals.length > 0);
  assert.ok(meals.every((meal) => meal.totalPrice > 0 && meal.totalPrice <= 10));
});

test("generateMeals enforces budget brackets", () => {
  const meals = generateMeals(products, {
    id: "budget_10_20",
    label: "$10-$20",
    minBudgetExclusive: 10,
    maxBudgetInclusive: 20
  });
  assert.ok(meals.every((meal) => meal.totalPrice > 10 && meal.totalPrice <= 20));
});

test("generateMeals sorts by deterministic score and price", () => {
  const meals = generateMeals(products, {
    id: "under_10",
    label: "Under $10",
    minBudgetExclusive: 0,
    maxBudgetInclusive: 10
  });
  assert.equal(meals[0].title, "Chicken Thighs with Rice and Carrots");
});
