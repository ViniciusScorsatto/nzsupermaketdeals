const KEYWORDS = {
  protein: [
    "chicken",
    "beef",
    "mince",
    "pork",
    "salmon",
    "tuna",
    "egg",
    "eggs",
    "tofu",
    "beans",
    "lentils",
    "sausages",
    "yoghurt",
    "yogurt"
  ],
  carb: [
    "rice",
    "pasta",
    "noodles",
    "potato",
    "potatoes",
    "bread",
    "wrap",
    "tortilla",
    "couscous",
    "oats"
  ],
  vegetable: [
    "broccoli",
    "carrot",
    "carrots",
    "celery",
    "cucumber",
    "cucumbers",
    "spinach",
    "lettuce",
    "tomato",
    "tomatoes",
    "capsicum",
    "pepper",
    "cabbage",
    "onion",
    "onions",
    "courgette",
    "zucchini",
    "mixed veg",
    "vegetable",
    "cauliflower",
    "bok choy"
  ]
};

const AMBIGUOUS_TERMS = [
  "meal",
  "ready",
  "snack",
  "dessert",
  "chips",
  "biscuit",
  "sauce",
  "drink",
  "cola",
  "chocolate"
];

export function categorizeProduct(product) {
  const haystack = `${product.name} ${product.categoryHint ?? ""}`.toLowerCase();

  for (const term of AMBIGUOUS_TERMS) {
    if (haystack.includes(term)) {
      return { category: "other", confidence: 0.15, reason: `ambiguous:${term}` };
    }
  }

  for (const [category, terms] of Object.entries(KEYWORDS)) {
    const match = terms.find((term) => haystack.includes(term));
    if (match) {
      return { category, confidence: 0.9, reason: `keyword:${match}` };
    }
  }

  return { category: "other", confidence: 0.1, reason: "unclassified" };
}

export function isEligibleMealProduct(product) {
  return (
    ["protein", "carb", "vegetable"].includes(product.category) &&
    product.confidence >= 0.75 &&
    Number.isFinite(product.price) &&
    product.price > 0
  );
}
