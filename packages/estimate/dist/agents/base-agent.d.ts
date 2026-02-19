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
    /** Read file contents for evaluation */
    protected readFiles(filePaths: string[]): Promise<Map<string, string>>;
    /** Load prompt from file in prompts/ directory */
    protected loadPrompt(filename: string): Promise<string>;
    /** Truncate content if too long */
    protected truncateContent(content: string, maxChars?: number): string;
}
//# sourceMappingURL=base-agent.d.ts.map