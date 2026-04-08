export { createIssue } from "./issue";
export {
  scoreToGrade,
  createEmptyPhaseResult,
  generateExplanation,
} from "./score-utils";
export {
  PHASE_WEIGHTS,
  PHASE_NAMES,
  GATE_ERROR_THRESHOLD,
  GATE_PENALTY_PER_PERCENT,
  GATE_MULTIPLIER_FLOOR,
  TYPE_CRITICAL_RATIO,
  PRISMA_PENALTY_CAP,
  MAX_COMBINED_PENALTY,
  AGENT_WEIGHT_RATIO,
  AGENT_WEIGHTS,
} from "./constants";

export type {
  Severity,
  IssueCategory,
  SourceLocation,
  Issue,
  CreateIssueInput,
} from "./issue";
export type {
  Grade,
  Phase,
  PhaseResult,
  EvaluationResult,
  IssueSummary,
  ScoreExplanation,
  ReferenceInfo,
  WarningPenalty,
  DuplicationPenalty,
  JsDocPenalty,
  SchemaSyncPenalty,
  EvaluationPenalties,
  ScoreBreakdown,
} from "./score";
export type {
  FixAdvice,
  FixAdvisory,
  FixAdviceSource,
  CodeSnippet,
  PenaltyRecovery,
} from "./fix-advice";
export type {
  EvaluationContext,
  EvaluationInput,
  EvaluationOptions,
  AutoBEProjectStructure,
  ProjectDependencies,
  SourceFiles,
  RuntimeResult,
  RuntimeTestResult,
} from "./context";
