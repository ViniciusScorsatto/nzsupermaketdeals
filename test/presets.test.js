import test from "node:test";
import assert from "node:assert/strict";
import { BUDGET_PRESETS, getPresetById } from "../src/domain/presets.js";

test("budget presets cover the intended affordability bands", () => {
  assert.deepEqual(
    BUDGET_PRESETS.map((preset) => preset.budget),
    [10, 15, 20, 25]
  );
});

test("getPresetById resolves configured budgets", () => {
  assert.equal(getPresetById("under_20")?.label, "Under $20");
});
