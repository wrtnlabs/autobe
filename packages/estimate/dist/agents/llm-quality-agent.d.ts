import { BaseAgent } from './base-agent';
import { AgentConfig, AgentResult } from './types';
import { EvaluationContext } from '../types';
/**
 * LLM Quality evaluation agent
 */
export declare class LLMQualityAgent extends BaseAgent {
    readonly name = "LLMQualityAgent";
    readonly description = "Evaluates AI-generated code for common LLM mistakes";
    constructor(config: AgentConfig);
    evaluate(context: EvaluationContext): Promise<AgentResult>;
}
//# sourceMappingURL=llm-quality-agent.d.ts.map