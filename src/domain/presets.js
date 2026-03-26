export const BUDGET_PRESETS = [
  { id: "under_10", label: "Under $10", minBudgetExclusive: 0, maxBudgetInclusive: 10 },
  { id: "budget_10_20", label: "$10-$20", minBudgetExclusive: 10, maxBudgetInclusive: 20 },
  { id: "budget_20_30", label: "$20-$30", minBudgetExclusive: 20, maxBudgetInclusive: 30 },
  { id: "budget_30_40", label: "$30-$40", minBudgetExclusive: 30, maxBudgetInclusive: 40 }
];

export function getPresetById(presetId) {
  return BUDGET_PRESETS.find((preset) => preset.id === presetId) ?? null;
}
