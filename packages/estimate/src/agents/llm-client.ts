import OpenAI from "openai";

import { getActiveTrace } from "../telemetry";
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
    const trace = getActiveTrace();
    const generation = trace?.generation({
      name: "llm-chat",
      model: this.model,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      modelParameters: { temperature: 0, maxTokens: this.maxTokens },
    });

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: 0,
      seed: 42,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    generation?.end({
      output: content,
      usage: { input: inputTokens, output: outputTokens },
    });

    return {
      content,
      tokensUsed: { input: inputTokens, output: outputTokens },
    };
  }

  getModel(): string {
    return this.model;
  }
}
