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

/** Token usage from LLM call */
export interface TokenUsage {
  input: number;
  output: number;
  inputCost?: number;
  outputCost?: number;
}

/** Parsed response from agent LLM call */
export interface AgentParseResult {
  issues: AgentIssue[];
  score: number;
  summary: string;
}

/** Result from a chunk evaluation (parsed + optional token usage) */
export interface AgentChunkResult {
  parsed: AgentParseResult;
  tokensUsed?: TokenUsage;
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
  tokensUsed?: TokenUsage;
}

/** Default models per agent role */
export const SECURITY_MODEL = "anthropic/claude-sonnet-4-6";
export const QUALITY_MODEL = "deepseek/deepseek-v3.2";
export const HALLUCINATION_MODEL = "deepseek/deepseek-v3.2";
