import { BUDGET_PRESETS } from "./presets.js";

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function capitalizePhrase(value) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function scoreMeal({ totalPrice, preset, protein, carb, vegetable }) {
  const budgetGap = preset.maxBudgetInclusive - totalPrice;
  const shortNamePenalty = [protein, carb, vegetable]
    .map((item) => item.name.trim().length)
    .filter((length) => length < 4).length;

  return Number((totalPrice + budgetGap * 0.05 + shortNamePenalty * 0.15).toFixed(4));
}

export function buildMealName({ protein, carb, vegetable }) {
  return `${capitalizePhrase(protein.name)} with ${capitalizePhrase(carb.name)} and ${capitalizePhrase(vegetable.name)}`;
}

export function generateMeals(products, preset) {
  const proteins = products.filter((product) => product.category === "protein");
  const carbs = products.filter((product) => product.category === "carb");
  const vegetables = products.filter((product) => product.category === "vegetable");
  const meals = [];

  for (const protein of proteins) {
    for (const carb of carbs) {
      for (const vegetable of vegetables) {
        const storeNames = new Set([protein.store, carb.store, vegetable.store]);
        const totalPrice = roundMoney(protein.price + carb.price + vegetable.price);

        if (
          totalPrice <= preset.minBudgetExclusive ||
          totalPrice > preset.maxBudgetInclusive
        ) {
          continue;
        }

        meals.push({
          presetId: preset.id,
          title: buildMealName({ protein, carb, vegetable }),
          totalPrice,
          budgetRange: {
            minExclusive: preset.minBudgetExclusive,
            maxInclusive: preset.maxBudgetInclusive
          },
          score: scoreMeal({ totalPrice, preset, protein, carb, vegetable }),
          store: storeNames.size === 1 ? protein.store : "Mixed",
          ingredients: [protein, carb, vegetable],
          recipePrompt: `Create a simple 3 to 5 step dinner recipe using ${protein.name}, ${carb.name}, and ${vegetable.name}. Keep it practical for everyday New Zealand households.`
        });
      }
    }
  }

  return meals
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      if (left.totalPrice !== right.totalPrice) {
        return left.totalPrice - right.totalPrice;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, 3);
}

export function generateMealsForAllPresets(products) {
  return BUDGET_PRESETS.map((preset) => ({
    preset,
    meals: generateMeals(products, preset)
  }));
}
