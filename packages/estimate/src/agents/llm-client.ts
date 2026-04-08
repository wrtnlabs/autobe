import OpenAI from "openai";

import { getActiveTrace } from "../telemetry";
import { AgentConfig, TokenUsage } from "./types";

/**
 * OpenRouter model pricing (USD per million tokens). Update when models or
 * pricing change.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "anthropic/claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "deepseek/deepseek-v3.2": { input: 0.3, output: 0.88 },
};

/** LLM API response */
interface LLMResponse {
  content: string;
  tokensUsed: TokenUsage;
}

/** LLM client using OpenAI SDK (OpenRouter compatible) */
export class LLMClient {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(config: AgentConfig) {
    if (!config.model) {
      throw new Error("AgentConfig.model is required");
    }
    this.model = config.model;
    this.maxTokens = config.maxTokens || 8192;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/wrtnlabs/autobe",
        "X-Title": "AutoBE Estimate",
      },
    });
  }

  async chat(
    systemPrompt: string,
    userPrompt: string,
    options?: { json?: boolean },
  ): Promise<LLMResponse> {
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
      ...(options?.json !== false
        ? { response_format: { type: "json_object" as const } }
        : {}),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    const pricing = MODEL_PRICING[this.model];
    const inputCost = pricing
      ? (inputTokens / 1_000_000) * pricing.input
      : undefined;
    const outputCost = pricing
      ? (outputTokens / 1_000_000) * pricing.output
      : undefined;

    generation?.end({
      output: content,
      usage: { input: inputTokens, output: outputTokens },
      ...(inputCost !== undefined && outputCost !== undefined
        ? {
            costDetails: {
              input: inputCost,
              output: outputCost,
              total: inputCost + outputCost,
            },
          }
        : {}),
    });

    const tokenUsage: TokenUsage = { input: inputTokens, output: outputTokens };
    if (inputCost !== undefined) tokenUsage.inputCost = inputCost;
    if (outputCost !== undefined) tokenUsage.outputCost = outputCost;

    return {
      content,
      tokensUsed: tokenUsage,
    };
  }

  getModel(): string {
    return this.model;
  }
}
