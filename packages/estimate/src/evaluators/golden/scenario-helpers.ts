export interface ScenarioResult {
  id: number;
  name: string;
  passed: boolean;
  reason?: string;
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

export function pass(id: number, name: string): ScenarioResult {
  return { id, name, passed: true };
}

export function fail(id: number, name: string, reason: string): ScenarioResult {
  return { id, name, passed: false, reason };
}
