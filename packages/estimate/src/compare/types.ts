/** Input types for comparison */
export interface CompareInput {
  projects: ProjectInput[];
  outputPath: string;
  useAgent?: boolean;
  provider?: string;
  apiKey?: string;
  verbose?: boolean;
}

export interface ProjectInput {
  path: string;
  name: string;
}

/** Phase scores for a project */
export interface ProjectScores {
  documentQuality: number;
  requirementsCoverage: number;
  testCoverage: number;
  logicCompleteness: number;
  apiCompleteness: number;
}

/** Project metric counts */
export interface ProjectMetrics {
  files: number;
  controllers: number;
  providers: number;
  structures: number;
  tests: number;
}

/** Agent evaluation scores */
export interface AgentScores {
  security: number;
  llmQuality: number;
  hallucination: number;
}

/** Project penalty breakdown */
export interface ProjectPenalties {
  warning?: number;
  duplication?: number;
  jsdoc?: number;
  total: number;
}

/** Issue counts by category */
export interface IssueCounts {
  gate: number;
  requirements: number;
  logic: number;
}

/** Result types for comparison */
export interface ProjectResult {
  name: string;
  path: string;
  totalScore: number;
  grade: string;
  gatePass: boolean;
  scores: ProjectScores;
  metrics: ProjectMetrics;
  agentScores?: AgentScores;
  penalties?: ProjectPenalties;
  issues: IssueCounts;
}

/** Report metadata */
export interface ReportMeta {
  evaluatedFiles?: number;
}

/** Gate phase in report */
export interface ReportGatePhase {
  passed?: boolean;
  issues?: unknown[];
}

/** Phase with score only */
export interface ReportScoredPhase {
  score?: number;
}

/** Requirements coverage phase with metrics */
export interface ReportRequirementsPhase {
  score?: number;
  issues?: unknown[];
  metrics?: ReportRequirementsPhase.Metrics;
}
export namespace ReportRequirementsPhase {
  export interface Metrics {
    controllerCount?: number;
    providerCount?: number;
    structureCount?: number;
  }
}

/** Test coverage phase with metrics */
export interface ReportTestCoveragePhase {
  score?: number;
  metrics?: ReportTestCoveragePhase.Metrics;
}
export namespace ReportTestCoveragePhase {
  export interface Metrics {
    testCount?: number;
  }
}

/** Logic completeness phase */
export interface ReportLogicPhase {
  score?: number;
  issues?: unknown[];
}

/** Report phases */
export interface ReportPhases {
  gate?: ReportGatePhase;
  documentQuality?: ReportScoredPhase;
  requirementsCoverage?: ReportRequirementsPhase;
  testCoverage?: ReportTestCoveragePhase;
  logicCompleteness?: ReportLogicPhase;
  apiCompleteness?: ReportScoredPhase;
}

/** Penalty amount entry */
export interface PenaltyAmount {
  amount: number;
}

/** Report penalties */
export interface ReportPenalties {
  warning?: PenaltyAmount;
  duplication?: PenaltyAmount;
  jsdoc?: PenaltyAmount;
}

export interface EstimateReport {
  totalScore?: number;
  grade?: string;
  meta?: ReportMeta;
  phases?: ReportPhases;
  penalties?: ReportPenalties;
  agentEvaluations?: AgentEvaluation[];
}

export interface AgentEvaluation {
  agent: string;
  score: number;
}

/** Named score entry (name + score pair) */
export interface NamedScore {
  name: string;
  score: number;
}

/** Named value entry (name + value pair) */
export interface NamedValue {
  name: string;
  value: number | string;
}

/** Ranking entry */
export interface RankingEntry {
  rank: number;
  name: string;
  score: number;
  grade: string;
}

/** Phase comparison entry */
export interface PhaseComparisonEntry {
  phase: string;
  scores: NamedScore[];
  winner: string;
}

/** Metric comparison entry */
export interface MetricComparisonEntry {
  metric: string;
  values: NamedValue[];
  better: string;
}

/** Agent comparison entry */
export interface AgentComparisonEntry {
  agent: string;
  scores: NamedScore[];
  winner: string;
}

/** Paths to saved report files */
export interface ReportPaths {
  mdPath: string;
  jsonPath: string;
}

/** Comparison summary */
export interface CompareSummary {
  overallWinner: string;
  recommendation: string;
}

export interface CompareResult {
  timestamp: string;
  projectCount: number;
  projects: ProjectResult[];
  ranking: RankingEntry[];
  phaseComparison: PhaseComparisonEntry[];
  metricComparison: MetricComparisonEntry[];
  agentComparison?: AgentComparisonEntry[];
  summary: CompareSummary;
}
