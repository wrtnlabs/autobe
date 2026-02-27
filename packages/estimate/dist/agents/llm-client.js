"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("./types");
/** LLM client using OpenAI SDK (OpenRouter compatible) */
class LLMClient {
    client;
    model;
    maxTokens;
    constructor(config) {
        this.model = config.model || types_1.DEFAULT_MODEL;
        this.maxTokens = config.maxTokens || 4096;
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "https://github.com/wrtnlabs/autobe",
                "X-Title": "AutoBE Estimate",
            },
        });
    }
    async chat(systemPrompt, userPrompt) {
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
        return {
            content: response.choices[0]?.message?.content || "",
            tokensUsed: {
                input: response.usage?.prompt_tokens || 0,
                output: response.usage?.completion_tokens || 0,
            },
        };
    }
    getModel() {
        return this.model;
    }
}
exports.LLMClient = LLMClient;
//# sourceMappingURL=llm-client.js.map