export { createIssue } from './issue';
export { scoreToGrade, createEmptyPhaseResult, generateExplanation, PHASE_WEIGHTS, PHASE_NAMES } from './score';

export type { Severity, IssueCategory, SourceLocation, Issue } from './issue';
export type { Grade, Phase, PhaseResult, EvaluationResult, IssueSummary, ScoreExplanation, ReferenceInfo } from './score';
export type {
  EvaluationContext,
  EvaluationInput,
  EvaluationOptions,
  AutoBEProjectStructure,
  ProjectDependencies,
  SourceFiles,
} from './context';
