import { AgentConfig, DEFAULT_MODEL } from './types';

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
 * OpenRouter API response type
 */
interface OpenRouterResponse {
  choices: { message: { content: string } }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * LLM client using OpenRouter (OpenAI-compatible API)
 */
export class LLMClient {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = {
      ...config,
      model: config.model || DEFAULT_MODEL,
      maxTokens: config.maxTokens || 4096,
    };
  }

  async chat(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://github.com/wrtnlabs/autobe',
        'X-Title': 'AutoBE Estimate',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as OpenRouterResponse;
    
    return {
      content: data.choices[0].message.content,
      tokensUsed: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
    };
  }

  getModel(): string {
    return this.config.model || DEFAULT_MODEL;
  }
}
