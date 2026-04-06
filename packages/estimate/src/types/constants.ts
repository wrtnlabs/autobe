import type { Phase } from "./score";

export const GATE_ERROR_THRESHOLD = 0.05;
export const GATE_PENALTY_PER_PERCENT = 5;
/**
 * Minimum gate multiplier when gate passes with penalties (gate=0 → 0.85,
 * gate=100 → 1.0)
 */
export const GATE_MULTIPLIER_FLOOR = 0.85;
/** Type error critical ratio threshold — above this, gate fails */
export const TYPE_CRITICAL_RATIO = 0.3;
/** Maximum prisma validation penalty */
export const PRISMA_PENALTY_CAP = 40;
/** Maximum total penalty from code quality deductions */
export const MAX_COMBINED_PENALTY = 20;
export const AGENT_WEIGHT_RATIO = 0.15;
export const AGENT_WEIGHTS: Record<string, number> = {
  SecurityAgent: 0.25, // 25% of agent portion — OWASP security audit (lowered: AutoBE auth guards are user-configured)
  LLMQualityAgent: 0.4, // 40% of agent portion — AI code quality patterns (best discriminator)
  HallucinationAgent: 0.35, // 35% of agent portion — spec compliance (OpenAPI + Prisma)
};

// Validate AGENT_WEIGHTS sum to 1.0 at module load
{
  const _weightSum = Object.values(AGENT_WEIGHTS).reduce((a, b) => a + b, 0);
  if (Math.abs(_weightSum - 1.0) > 0.001) {
    console.warn(
      `[estimate] AGENT_WEIGHTS sum to ${_weightSum}, expected 1.0. Scores may be inaccurate.`,
    );
  }
}

/** New phase weights (total = 100%) */
export const PHASE_WEIGHTS: Record<Phase, number> = {
  // Gate (pass/fail, no weight)
  gate: 0,
  // New scoring phases
  documentQuality: 0.07, // 7% (M-1: increased from 5% for better doc incentive)
  requirementsCoverage: 0.18, // 18%
  testCoverage: 0.23, // 23% (best cross-model discriminator)
  logicCompleteness: 0.3, // 30%
  apiCompleteness: 0.07, // 7% (C-1: restored with improved evaluator discrimination)
  goldenSet: 0.15, // 15% (runtime functional testing)
  // Legacy (not used in score)
  requirements: 0,
  database: 0,
  api: 0,
  test: 0,
  implementation: 0,
  functionality: 0,
  quality: 0,
  safety: 0,
  llmSpecific: 0,
};

// Validate active PHASE_WEIGHTS sum to 1.0 at module load
{
  const _activeWeightSum = [
    PHASE_WEIGHTS.documentQuality,
    PHASE_WEIGHTS.requirementsCoverage,
    PHASE_WEIGHTS.testCoverage,
    PHASE_WEIGHTS.logicCompleteness,
    PHASE_WEIGHTS.apiCompleteness,
    PHASE_WEIGHTS.goldenSet,
  ].reduce((a, b) => a + b, 0);
  if (Math.abs(_activeWeightSum - 1.0) > 0.001) {
    console.warn(
      `[estimate] Active PHASE_WEIGHTS sum to ${_activeWeightSum}, expected 1.0. Scores may be inaccurate.`,
    );
  }
}

/** Phase display names */
export const PHASE_NAMES: Record<Phase, string> = {
  gate: "Gate",
  // New scoring phases
  documentQuality: "Document Quality",
  requirementsCoverage: "Requirements Coverage",
  testCoverage: "Test Coverage",
  logicCompleteness: "Logic Completeness",
  apiCompleteness: "API Completeness",
  // Legacy
  requirements: "Requirements (Analyze)",
  database: "DB Design (Database)",
  api: "API Design (Interface)",
  test: "Test (Test)",
  implementation: "Implementation (Realize)",
  functionality: "Functionality",
  quality: "Quality",
  safety: "Safety",
  llmSpecific: "LLM Specific",
  goldenSet: "Golden Set",
};
