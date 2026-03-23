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
