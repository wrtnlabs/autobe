import { AgentConfig } from './types';
/**
 * LLM API response
 */
interface LLMResponse {
    content: string;
    tokensUsed: {
        input: number;
        output: number;
    };
}
/**
 * LLM client using OpenAI SDK (OpenRouter compatible)
 */
export declare class LLMClient {
    private client;
    private model;
    private maxTokens;
    constructor(config: AgentConfig);
    chat(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
    getModel(): string;
}
export {};
//# sourceMappingURL=llm-client.d.ts.map