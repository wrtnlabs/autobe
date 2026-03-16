export type Grade = "A" | "B" | "C" | "D" | "F";

export interface IssueSummary {
  code: string;
  count: number;
  severity: string;
  message: string;
}

export interface PhaseExplanation {
  reasons: string[];
  issueSummaries: IssueSummary[];
  suggestions: string[];
}

export interface BenchmarkPhaseScore {
  score: number;
  maxScore: number;
  weightedScore: number;
  passed: boolean;
  durationMs: number;
  metrics?: Record<string, number | string | boolean>;
  explanation?: PhaseExplanation;
}

export interface GateIssueByCode {
  code: string;
  count: number;
  severity: string;
  message: string;
}

export interface BenchmarkGateScore extends BenchmarkPhaseScore {
  typeErrorCount: number;
  typeWarningCount: number;
  suggestionCount: number;
  issuesByCode: GateIssueByCode[];
}

export interface BenchmarkPhases {
  gate: BenchmarkGateScore;
  documentQuality: BenchmarkPhaseScore;
  requirementsCoverage: BenchmarkPhaseScore;
  testCoverage: BenchmarkPhaseScore;
  logicCompleteness: BenchmarkPhaseScore;
  apiCompleteness: BenchmarkPhaseScore;
}

export interface BenchmarkPenalties {
  warning?: { amount: number; ratio: string };
  duplication?: { amount: number; blocks: number };
  jsdoc?: { amount: number; missing: number; ratio: string };
  schemaSync?: {
    amount: number;
    emptyTypes: number;
    mismatchedProperties: number;
  };
  suggestionOverflow?: { amount: number; count: number };
}

export interface BenchmarkSummary {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  suggestionCount: number;
}

export interface BenchmarkMeta {
  evaluatedAt: string;
  totalDurationMs: number;
  evaluatedFiles: number;
}

export interface BenchmarkReference {
  complexity: {
    totalFunctions: number;
    complexFunctions: number;
    maxComplexity: number;
  };
  duplication: { totalBlocks: number };
  naming: { totalIssues: number };
  jsdoc: { totalMissing: number };
  schemaSync: {
    totalTypes: number;
    emptyTypes: number;
    mismatchedProperties: number;
  };
}

export interface AgentMetricEntry {
  attempt: number;
  success: number;
  failure: number;
}

export interface AnalyzeDetail {
  prefix: string | null;
  actors: { name: string; kind: string; description: string }[];
  documents: {
    filename: string;
    documentType: string;
    outline: string[];
  }[];
  agentMetrics: Record<string, AgentMetricEntry> | null;
}

export interface DatabaseDetail {
  schemas: { filename: string; models: number; enums: number }[];
  totalModels: number;
  totalEnums: number;
  compiled: boolean;
  agentMetrics: Record<string, AgentMetricEntry> | null;
}

export interface InterfaceDetail {
  operations: {
    name: string;
    method: string;
    path: string;
    description: string;
    auth: string;
  }[];
  authorizations: string[];
  missed: string[];
  agentMetrics: Record<string, AgentMetricEntry> | null;
}

export interface TestDetail {
  functions: { name: string; path: string; method: string }[];
  compiled: boolean;
  agentMetrics: Record<string, AgentMetricEntry> | null;
}

export interface RealizeDetail {
  functions: { name: string; path: string; method: string }[];
  compileResult: {
    success: boolean;
    errors: { file: string; code: number; message: string }[];
  } | null;
  agentMetrics: Record<string, AgentMetricEntry> | null;
}

export type PipelinePhaseDetail =
  | AnalyzeDetail
  | DatabaseDetail
  | InterfaceDetail
  | TestDetail
  | RealizeDetail;

export interface PipelinePhaseData {
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  createdAt?: string;
  completedAt?: string;
  durationMs?: number;
  completed?: boolean;
  detail?: PipelinePhaseDetail;
}

export interface PipelineData {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  phases: Record<PipelinePhaseName, PipelinePhaseData>;
}

export type PipelinePhaseName =
  | "analyze"
  | "database"
  | "interface"
  | "test"
  | "realize";

export const PIPELINE_PHASES: PipelinePhaseName[] = [
  "analyze",
  "database",
  "interface",
  "test",
  "realize",
];

export const PIPELINE_PHASE_DISPLAY: Record<
  PipelinePhaseName,
  { label: string; description: string }
> = {
  analyze: {
    label: "Analyze",
    description: "Requirements analysis & scenario generation",
  },
  database: {
    label: "Database",
    description: "Prisma schema generation & validation",
  },
  interface: {
    label: "Interface",
    description: "OpenAPI specification & endpoint design",
  },
  test: { label: "Test", description: "E2E test scenario & code generation" },
  realize: {
    label: "Realize",
    description: "Implementation code generation & compilation",
  },
};

export interface BenchmarkEntry {
  model: string;
  project: string;
  totalScore: number;
  grade: Grade;
  pipeline: PipelineData | null;
  phases: BenchmarkPhases;
  penalties: BenchmarkPenalties | null;
  summary: BenchmarkSummary;
  meta: BenchmarkMeta;
  reference: BenchmarkReference;
}

export interface BenchmarkData {
  entries: BenchmarkEntry[];
  models: string[];
  projects: string[];
  generatedAt: string;
}

export const PHASE_WEIGHTS: Record<string, number> = {
  documentQuality: 0.05,
  requirementsCoverage: 0.25,
  testCoverage: 0.25,
  logicCompleteness: 0.35,
  apiCompleteness: 0.1,
};

export const PHASE_DISPLAY_NAMES: Record<string, string> = {
  documentQuality: "Document Quality",
  requirementsCoverage: "Requirements Coverage",
  testCoverage: "Test Coverage",
  logicCompleteness: "Logic Completeness",
  apiCompleteness: "API Completeness",
};

export const SCORING_PHASES = [
  "documentQuality",
  "requirementsCoverage",
  "testCoverage",
  "logicCompleteness",
  "apiCompleteness",
] as const;

export type ScoringPhase = (typeof SCORING_PHASES)[number];
