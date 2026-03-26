import { BUDGET_PRESETS } from "./presets.js";

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

export function buildStartMessage() {
  return [
    "Affordable meals from NZ supermarket specials.",
    "",
    "Choose your budget and I will find the best meal ideas from today's deals."
  ].join("\n");
}

export function buildPresetKeyboard() {
  return {
    inline_keyboard: BUDGET_PRESETS.map((preset) => [
      { text: preset.label, callback_data: `preset:${preset.id}` }
    ])
  };
}

export function buildMealResponse(preset, meals) {
  if (!meals.length) {
    return [
      `No strong matches found for ${preset.label} today.`,
      "",
      "The bot skipped low-confidence products rather than suggesting a weird meal. Try a higher budget again after the next refresh."
    ].join("\n");
  }

  return meals
    .map((meal, index) => {
      const ingredients = meal.ingredients
        .map((ingredient) => `- ${ingredient.name} (${formatMoney(ingredient.price)})`)
        .join("\n");
      const links = meal.ingredients
        .map((ingredient) => `- <a href="${ingredient.url}">${ingredient.name}</a>`)
        .join("\n");
      const recipe = meal.recipeSteps.map((step, stepIndex) => `${stepIndex + 1}. ${step}`).join("\n");

      return [
        `${index + 1}. <b>${meal.title}</b>`,
        `Budget: ${preset.label}`,
        `Total: <b>${formatMoney(meal.totalPrice)}</b>`,
        `Store: ${meal.store}`,
        "",
        "<b>Ingredients</b>",
        ingredients,
        "",
        "<b>Recipe</b>",
        recipe,
        "",
        "<b>Buy links</b>",
        links
      ].join("\n");
    })
    .join("\n\n");
}

export function buildFeaturedMealResponse(featuredMeal) {
  if (!featuredMeal) {
    return "No featured meal is available yet. Run a refresh first.";
  }

  return [
    "Today's featured affordable meal",
    "",
    buildMealResponse(
      { label: featuredMeal.presetLabel },
      [
        {
          ...featuredMeal,
          recipeSteps: featuredMeal.recipeSteps
        }
      ]
    )
  ].join("\n");
}
