/** Scenario category for weighted scoring */
export type ScenarioCategory =
  | "auth"
  | "crud"
  | "query"
  | "negative"
  | "cleanup"
  | "workflow";

export interface ScenarioResult {
  id: number;
  name: string;
  passed: boolean;
  reason?: string;
  /** Category for weighted scoring */
  category?: ScenarioCategory;
  /** Optional schema validation warnings (not blocking, but reported) */
  schemaWarnings?: string[];
  /** Response time in milliseconds (from last HTTP call in scenario) */
  durationMs?: number;
}

export function randomEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
}

export function randomPassword(): string {
  return `Pass${Math.random().toString(36).slice(2)}1!`;
}

export function randomUsername(): string {
  return `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function pass(
  id: number,
  name: string,
  category?: ScenarioCategory,
): ScenarioResult {
  return { id, name, passed: true, category };
}

export function fail(
  id: number,
  name: string,
  reason: string,
  category?: ScenarioCategory,
): ScenarioResult {
  return { id, name, passed: false, reason, category };
}

/**
 * Run a scenario function with error isolation. If the scenario throws, it
 * returns a fail result instead of crashing the entire suite.
 */
export async function safeScenario(
  id: number,
  name: string,
  category: ScenarioCategory,
  fn: () => Promise<ScenarioResult>,
): Promise<ScenarioResult> {
  const start = performance.now();
  try {
    const result = await fn();
    // Attach durationMs if not already set
    if (result.durationMs === undefined) {
      result.durationMs = Math.round(performance.now() - start);
    }
    return result;
  } catch (err) {
    return {
      id,
      name,
      passed: false,
      reason: `Scenario crashed: ${err instanceof Error ? err.message : String(err)}`,
      category,
      durationMs: Math.round(performance.now() - start),
    };
  }
}
