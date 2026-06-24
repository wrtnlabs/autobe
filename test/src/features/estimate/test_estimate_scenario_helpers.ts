import {
  fail,
  pass,
} from "@autobe/estimate/src/evaluators/golden/scenario-helpers";
import type { ScenarioResult } from "@autobe/estimate/src/evaluators/golden/scenario-helpers";
import { safeSuite } from "@autobe/estimate/src/evaluators/golden/scenario-helpers";
import assert from "node:assert/strict";

export const test_estimate_scenario_helpers = async (): Promise<void> => {
  assert.deepEqual(pass(1, "test scenario", "crud"), {
    id: 1,
    name: "test scenario",
    passed: true,
    category: "crud",
  });

  const uncategorized = pass(2, "no category");
  assert.equal(uncategorized.passed, true);
  assert.equal(uncategorized.category, undefined);

  assert.deepEqual(fail(3, "failing test", "404 not found", "negative"), {
    id: 3,
    name: "failing test",
    passed: false,
    reason: "404 not found",
    category: "negative",
  });

  const successful: ScenarioResult[] = [];
  await safeSuite(successful, "test-suite", async () => {
    successful.push(pass(1, "a"));
    successful.push(pass(2, "b"));
  });
  assert.equal(successful.length, 2);
  assert(successful.every((result) => result.passed));

  const crashed: ScenarioResult[] = [];
  await safeSuite(crashed, "crash-suite", async () => {
    crashed.push(pass(1, "before crash"));
    throw new Error("boom");
  });
  assert.equal(crashed.length, 2);
  assert.equal(crashed[0].passed, true);
  assert.equal(crashed[0].name, "before crash");
  assert.equal(crashed[1].passed, false);
  assert.equal(crashed[1].name, "crash-suite (crashed)");
  assert.match(crashed[1].reason ?? "", /boom/);
};
