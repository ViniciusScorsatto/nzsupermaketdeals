import test from "node:test";
import assert from "node:assert/strict";
import { BUDGET_PRESETS, getPresetById } from "../src/domain/presets.js";

test("budget presets cover the intended affordability bands", () => {
  assert.deepEqual(
    BUDGET_PRESETS.map((preset) => [preset.minBudgetExclusive, preset.maxBudgetInclusive]),
    [
      [0, 10],
      [10, 20],
      [20, 30],
      [30, 40]
    ]
  );
});

test("getPresetById resolves configured budgets", () => {
  assert.equal(getPresetById("budget_20_30")?.label, "$20-$30");
});
