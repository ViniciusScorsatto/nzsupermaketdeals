export const BUDGET_PRESETS = [
  { id: "under_10", label: "Under $10", budget: 10 },
  { id: "under_15", label: "Under $15", budget: 15 },
  { id: "under_20", label: "Under $20", budget: 20 },
  { id: "under_25", label: "Under $25", budget: 25 }
];

export function getPresetById(presetId) {
  return BUDGET_PRESETS.find((preset) => preset.id === presetId) ?? null;
}
