/** Supported LLM providers */
export type LLMProvider = "openrouter";

/** Agent configuration */
export interface AgentConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

/** Agent evaluation issue */
export interface AgentIssue {
  severity: "critical" | "warning" | "suggestion";
  type: string;
  file: string;
  line?: number;
  description: string;
  suggestion?: string;
}

/** Agent evaluation result */
export interface AgentResult {
  agent: string;
  provider: LLMProvider;
  model: string;
  issues: AgentIssue[];
  score: number;
  summary: string;
  durationMs: number;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/** Default model */
export const DEFAULT_MODEL = "qwen/qwen3-next-80b-a3b-instruct";
