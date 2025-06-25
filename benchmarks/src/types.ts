import { AutoBeAgent } from "@autobe/agent";

// Import AutoBE event types
export type AutoBeAgentType = AutoBeAgent<"chatgpt">;

// Validation result structure
export interface ValidationResult {
  analysisFiles?: Record<string, string>;
  prismaSchema?: string;
  interfaceDocument?: unknown;
}

export interface BenchmarkResult {
  testName: string;
  runId: string; // Unique identifier for this run
  flowSuccess: boolean; // Whether the flow completed without errors
  duration: number;
  errors: string[];
  stages: {
    analyze: { success: boolean; duration: number; errors: string[]; output?: string };
    prisma: { success: boolean; duration: number; errors: string[]; output?: string; compilationDetails?: string };
    interface: { success: boolean; duration: number; errors: string[]; output?: string };
    test?: { success: boolean; duration: number; errors: string[]; output?: string };
  };
  adversarialQuestions: {
    question: string;
    response: string;
    validated: boolean;
    issues: string[];
    timestamp: string;
    category?: string; // Category of the question (e.g., 'analysis', 'schema', 'api', 'general')
  }[];
  completenessScore: number; // Score from adversarial validation (0-100)
  completenessBreakdown: {
    analysis: { total: number; validated: number; score: number };
    schema: { total: number; validated: number; score: number };
    api: { total: number; validated: number; score: number };
    security: { total: number; validated: number; score: number };
    performance: { total: number; validated: number; score: number };
    errorHandling: { total: number; validated: number; score: number };
    dataConsistency: { total: number; validated: number; score: number };
    userExperience: { total: number; validated: number; score: number };
    general: { total: number; validated: number; score: number };
  };
  logs: string[]; // Detailed execution logs
  generatedFiles: Record<string, string>; // Generated files for analysis
  failureReason?: string; // Primary failure reason if flow failed
  timestamp: string; // ISO timestamp of run start
}

export interface ScenarioResults {
  scenarioName: string;
  totalRuns: number;
  successfulRuns: number;
  successRate: number; // Percentage of successful flows
  averageCompleteness: number; // Average completeness score
  averageCompletenessBreakdown: {
    analysis: number;
    schema: number;
    api: number;
    security: number;
    performance: number;
    errorHandling: number;
    dataConsistency: number;
    userExperience: number;
    general: number;
  };
  averageDuration: number;
  averageStageTimings: {
    analysis: number; // Average duration for analysis stage
    schema: number;   // Average duration for schema stage
    api: number;      // Average duration for API stage
  };
  totalScenarioDuration: number; // Total time for all runs of this scenario
  runs: BenchmarkResult[];
}

export interface BenchmarkSummary {
  totalScenarios: number;
  totalRuns: number;
  totalBenchmarkDuration: number; // Total time for entire benchmark
  overallSuccessRate: number;
  overallCompleteness: number;
  overallCompletenessBreakdown: {
    analysis: number;
    schema: number;
    api: number;
    security: number;
    performance: number;
    errorHandling: number;
    dataConsistency: number;
    userExperience: number;
    general: number;
  };
  overallStageTimings: {
    analysis: number; // Average duration for analysis stage across all scenarios
    schema: number;   // Average duration for schema stage across all scenarios
    api: number;      // Average duration for API stage across all scenarios
  };
  scenarios: ScenarioResults[];
  startTime: string;
  endTime: string;
}

export interface TestScenario {
  name: string;
  description: string;
  initialPrompt: string;
  followUpPrompts: string[];
  adversarialPrompts: string[];
  validationCriteria: {
    requiresAnalysis: boolean;
    requiresPrismaSchema: boolean;
    requiresApiInterface: boolean;
    requiresTests: boolean;
    customValidations: ((result: ValidationResult) => { valid: boolean; issues: string[] })[];
  };
}