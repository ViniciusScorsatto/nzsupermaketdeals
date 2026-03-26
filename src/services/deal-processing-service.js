import { categorizeProduct, isEligibleMealProduct } from "../domain/categories.js";
import { generateMealsForAllPresets } from "../domain/meal-engine.js";
import {
  createScrapeRun,
  completeScrapeRun,
  upsertProducts,
  replaceGeneratedMeals,
  replaceMealIngredients,
  replaceFeaturedMeal
} from "../db/repositories.js";

function currentDateString(timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export async function processDealProducts({
  pool,
  recipeService,
  timezone,
  productsBySource
}) {
  const scrapeRunId = await createScrapeRun(pool);
  const summary = {
    stores: {},
    productsProcessed: 0,
    mealsGenerated: 0
  };

  try {
    const normalizedProducts = [];

    for (const [sourceKey, sourceProducts] of Object.entries(productsBySource)) {
      try {
        const classifiedProducts = sourceProducts.map((product) => {
          const classification = categorizeProduct(product);
          return {
            ...product,
            category: classification.category,
            confidence: classification.confidence,
            classificationReason: classification.reason
          };
        });

        normalizedProducts.push(...classifiedProducts);
        const eligibleCount = classifiedProducts.filter(isEligibleMealProduct).length;
        summary.stores[sourceKey] = {
          status: "success",
          rawProductsFound: classifiedProducts.length,
          eligibleProductsFound: eligibleCount
        };
      } catch (error) {
        summary.stores[sourceKey] = {
          status: "error",
          message: error.message
        };
      }
    }

    const eligibleProducts = normalizedProducts.filter(isEligibleMealProduct);
    const productIdMap = await upsertProducts(pool, eligibleProducts, scrapeRunId);
    const mealsByPreset = generateMealsForAllPresets(eligibleProducts);

    for (const entry of mealsByPreset) {
      for (const meal of entry.meals) {
        meal.recipeSteps = await recipeService.generateRecipeSteps(meal);
      }
    }

    const storedMeals = await replaceGeneratedMeals(pool, scrapeRunId, mealsByPreset);
    await replaceMealIngredients(pool, storedMeals, productIdMap);

    const featuredMeal = storedMeals.sort((left, right) => left.score - right.score)[0] ?? null;
    if (featuredMeal) {
      await replaceFeaturedMeal(pool, currentDateString(timezone), featuredMeal);
    }

    summary.productsProcessed = eligibleProducts.length;
    summary.mealsGenerated = storedMeals.length;

    await completeScrapeRun(pool, scrapeRunId, summary, "success");

    return {
      scrapeRunId,
      summary
    };
  } catch (error) {
    summary.error = error.message;
    await completeScrapeRun(pool, scrapeRunId, summary, "error");
    throw error;
  }
}
