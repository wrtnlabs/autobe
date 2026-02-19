import OpenAI from "openai";

import { AgentConfig, DEFAULT_MODEL } from "./types";

/** LLM API response */
interface LLMResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

/** LLM client using OpenAI SDK (OpenRouter compatible) */
export class LLMClient {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(config: AgentConfig) {
    this.model = config.model || DEFAULT_MODEL;
    this.maxTokens = config.maxTokens || 4096;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/wrtnlabs/autobe",
        "X-Title": "AutoBE Estimate",
      },
    });
  }

  async chat(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return {
      content: response.choices[0]?.message?.content || "",
      tokensUsed: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
    };
  }

  getModel(): string {
    return this.model;
  }
}
