import OpenAI from "openai";

function fallbackRecipe(meal) {
  const [protein, carb, vegetable] = meal.ingredients;

  return [
    `Prep the ${protein.name}, ${carb.name}, and ${vegetable.name}.`,
    `Cook the ${carb.name} until tender and start the ${protein.name} in a hot pan.`,
    `Add the ${vegetable.name} and cook until just softened.`,
    `Season everything simply, combine, and serve hot.`
  ];
}

export class RecipeService {
  constructor({ apiKey, model }) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model = model;
  }

  async generateRecipeSteps(meal) {
    if (!this.client) {
      return fallbackRecipe(meal);
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          {
            role: "system",
            content:
              "You write practical 3 to 5 step dinner recipes for cost-conscious New Zealand households. Keep language concise and realistic."
          },
          {
            role: "user",
            content: meal.recipePrompt
          }
        ]
      });

      const rawText = response.output_text?.trim();
      if (!rawText) {
        return fallbackRecipe(meal);
      }

      const steps = rawText
        .split(/\n+/)
        .map((line) => line.replace(/^\d+[\).\s-]*/, "").trim())
        .filter(Boolean)
        .slice(0, 5);

      return steps.length ? steps : fallbackRecipe(meal);
    } catch {
      return fallbackRecipe(meal);
    }
  }
}
