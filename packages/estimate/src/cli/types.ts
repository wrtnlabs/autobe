import type { LLMProvider } from "../agents";

export interface CLIOptions {
  input: string;
  output: string;
  verbose?: boolean;
  continueOnGateFailure?: boolean;
  useAgent?: boolean;
  provider?: LLMProvider;
  apiKey?: string;
  autoFix?: boolean;
  runTests?: boolean;
  golden?: boolean;
  project?: string;
}

export interface CompareCommandOptions {
  projects: string[];
  output: string;
  verbose?: boolean;
  useAgent?: boolean;
  provider?: string;
  apiKey?: string;
}

export interface BatchCommandOptions {
  examples: string;
  output: string;
  useAgent?: boolean;
  provider?: string;
  apiKey?: string;
  continueOnGateFailure?: boolean;
  verbose?: boolean;
  model?: string;
  project?: string;
}

export interface BatchTarget {
  model: string;
  project: string;
  inputPath: string;
}

export const VALID_PROJECTS = new Set([
  "todo",
  "bbs",
  "reddit",
  "shopping",
  "erp",
  "gauzy",
]);
