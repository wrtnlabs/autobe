import type { EvaluationResult } from '../types';

/**
 * Generate JSON report string
 */
export function generateJsonReport(result: EvaluationResult): string {
  return JSON.stringify(result, null, 2);
}
