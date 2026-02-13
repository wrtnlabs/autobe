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

/** Result types for comparison */
export interface ProjectResult {
  name: string;
  path: string;
  totalScore: number;
  grade: string;
  gatePass: boolean;
  scores: {
    documentQuality: number;
    requirementsCoverage: number;
    testCoverage: number;
    logicCompleteness: number;
    apiCompleteness: number;
  };
  metrics: {
    files: number;
    controllers: number;
    providers: number;
    structures: number;
    tests: number;
  };
  agentScores?: {
    security: number;
    llmQuality: number;
  };
  issues: {
    gate: number;
    requirements: number;
    logic: number;
  };
}

export interface EstimateReport {
  totalScore?: number;
  grade?: string;
  meta?: {
    evaluatedFiles?: number;
  };
  phases?: {
    gate?: { passed?: boolean; issues?: unknown[] };
    documentQuality?: { score?: number };
    requirementsCoverage?: {
      score?: number;
      issues?: unknown[];
      metrics?: {
        controllerCount?: number;
        providerCount?: number;
        structureCount?: number;
      };
    };
    testCoverage?: { score?: number; metrics?: { testCount?: number } };
    logicCompleteness?: { score?: number; issues?: unknown[] };
    apiCompleteness?: { score?: number };
  };
  agentEvaluations?: AgentEvaluation[];
}

export interface AgentEvaluation {
  agent: string;
  score: number;
}

export interface CompareResult {
  timestamp: string;
  projectCount: number;
  projects: ProjectResult[];
  ranking: {
    rank: number;
    name: string;
    score: number;
    grade: string;
  }[];
  phaseComparison: {
    phase: string;
    scores: { name: string; score: number }[];
    winner: string;
  }[];
  metricComparison: {
    metric: string;
    values: { name: string; value: number | string }[];
    better: string;
  }[];
  agentComparison?: {
    agent: string;
    scores: { name: string; score: number }[];
    winner: string;
  }[];
  summary: {
    overallWinner: string;
    recommendation: string;
  };
}
