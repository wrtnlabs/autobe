import { describe, expect, it } from "vitest";

import { type ScenarioResult, fail, pass, safeSuite } from "./scenario-helpers";

describe("pass", () => {
  it("creates a passed result", () => {
    const result = pass(1, "test scenario", "crud");
    expect(result).toEqual({
      id: 1,
      name: "test scenario",
      passed: true,
      category: "crud",
    });
  });

  it("works without category", () => {
    const result = pass(2, "no category");
    expect(result.passed).toBe(true);
    expect(result.category).toBeUndefined();
  });
});

describe("fail", () => {
  it("creates a failed result with reason", () => {
    const result = fail(3, "failing test", "404 not found", "negative");
    expect(result).toEqual({
      id: 3,
      name: "failing test",
      passed: false,
      reason: "404 not found",
      category: "negative",
    });
  });
});

describe("safeSuite", () => {
  it("collects results from successful suite", async () => {
    const results: ScenarioResult[] = [];
    await safeSuite(results, "test-suite", async () => {
      results.push(pass(1, "a"));
      results.push(pass(2, "b"));
    });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it("preserves partial results on crash", async () => {
    const results: ScenarioResult[] = [];
    await safeSuite(results, "crash-suite", async () => {
      results.push(pass(1, "before crash"));
      throw new Error("boom");
    });
    expect(results).toHaveLength(2);
    expect(results[0].passed).toBe(true);
    expect(results[0].name).toBe("before crash");
    expect(results[1].passed).toBe(false);
    expect(results[1].name).toBe("crash-suite (crashed)");
    expect(results[1].reason).toContain("boom");
  });
});
