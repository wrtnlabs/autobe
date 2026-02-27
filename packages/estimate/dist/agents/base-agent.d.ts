import { EvaluationContext } from "../types";
import { LLMClient } from "./llm-client";
import { AgentConfig, AgentIssue, AgentResult } from "./types";
/** Base class for AI evaluation agents */
export declare abstract class BaseAgent {
    abstract readonly name: string;
    abstract readonly description: string;
    protected client: LLMClient;
    protected config: AgentConfig;
    constructor(config: AgentConfig);
    /** Run the agent evaluation */
    abstract evaluate(context: EvaluationContext): Promise<AgentResult>;
    /** Parse JSON response from LLM */
    protected parseResponse(content: string): {
        issues: AgentIssue[];
        score: number;
        summary: string;
    };
    /** Chat with retry on parse failure */
    protected chatWithRetry(systemPrompt: string, userPrompt: string, maxRetries?: number): Promise<{
        parsed: {
            issues: AgentIssue[];
            score: number;
            summary: string;
        };
        tokensUsed?: {
            input: number;
            output: number;
        };
    }>;
    /** Split file map into chunks that fit within maxChars */
    protected splitIntoChunks(fileContents: Map<string, string>, rootPath: string, maxChars?: number): string[];
    /** Evaluate multiple chunks and merge results */
    protected evaluateChunks(systemPrompt: string, chunks: string[], buildUserPrompt: (chunk: string, index: number, total: number) => string): Promise<{
        parsed: {
            issues: AgentIssue[];
            score: number;
            summary: string;
        };
        tokensUsed?: {
            input: number;
            output: number;
        };
    }>;
    /** Run async tasks with concurrency limit */
    protected runWithConcurrency<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, limit: number): Promise<R[]>;
    /** Deduplicate agent issues by type+file or description similarity */
    protected deduplicateIssues(issues: AgentIssue[]): AgentIssue[];
    /** Check if two descriptions are similar (>60% word overlap) */
    private isSimilar;
    /** Read file contents for evaluation */
    protected readFiles(filePaths: string[]): Promise<Map<string, string>>;
    /** Load prompt from file in prompts/ directory */
    protected loadPrompt(filename: string): Promise<string>;
    /** Truncate content if too long */
    protected truncateContent(content: string, maxChars?: number): string;
}
//# sourceMappingURL=base-agent.d.ts.map