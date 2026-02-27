"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const llm_client_1 = require("./llm-client");
/** Base class for AI evaluation agents */
class BaseAgent {
    client;
    config;
    constructor(config) {
        this.config = config;
        this.client = new llm_client_1.LLMClient(config);
    }
    /** Parse JSON response from LLM */
    parseResponse(content) {
        try {
            let jsonStr = content;
            if (jsonStr.includes("```json")) {
                jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
            }
            else if (jsonStr.includes("```")) {
                jsonStr = jsonStr.replace(/```\n?/g, "");
            }
            const parsed = JSON.parse(jsonStr.trim());
            return {
                issues: parsed.issues || [],
                score: typeof parsed.score === "number" ? parsed.score : 100,
                summary: parsed.summary || "No summary provided",
            };
        }
        catch (_error) {
            console.error(`  ⚠ ${this.constructor.name}: JSON parse failed`);
            return {
                issues: [],
                score: 0,
                summary: "Failed to parse agent response",
            };
        }
    }
    /** Chat with retry on parse failure */
    async chatWithRetry(systemPrompt, userPrompt, maxRetries = 2) {
        let lastError = "";
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.chat(systemPrompt, userPrompt);
                const parsed = this.parseResponse(response.content);
                if (parsed.summary === "Failed to parse agent response" &&
                    attempt < maxRetries) {
                    lastError = "JSON parse failed";
                    console.log(`  ↻ ${this.name} retry ${attempt + 1}/${maxRetries} (${lastError})`);
                    continue;
                }
                return { parsed, tokensUsed: response.tokensUsed };
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : "Unknown error";
                if (attempt < maxRetries) {
                    console.log(`  ↻ ${this.name} retry ${attempt + 1}/${maxRetries} (${lastError})`);
                    continue;
                }
            }
        }
        return {
            parsed: {
                issues: [],
                score: 0,
                summary: `Failed after ${maxRetries + 1} attempts: ${lastError}`,
            },
        };
    }
    /** Split file map into chunks that fit within maxChars */
    splitIntoChunks(fileContents, rootPath, maxChars = 30000) {
        const path = require("path");
        const chunks = [];
        let current = "";
        for (const [filePath, content] of fileContents) {
            const relativePath = path.relative(rootPath, filePath);
            const block = `\n### File: ${relativePath}\n\`\`\`typescript\n${content}\n\`\`\`\n`;
            if (current.length + block.length > maxChars && current.length > 0) {
                chunks.push(current);
                current = block;
            }
            else {
                current += block;
            }
        }
        if (current.length > 0) {
            chunks.push(current);
        }
        return chunks;
    }
    /** Evaluate multiple chunks and merge results */
    async evaluateChunks(systemPrompt, chunks, buildUserPrompt) {
        if (chunks.length <= 1) {
            const prompt = buildUserPrompt(chunks[0] || "", 1, 1);
            return this.chatWithRetry(systemPrompt, prompt);
        }
        const allIssues = [];
        const scores = [];
        const summaries = [];
        let totalInput = 0;
        let totalOutput = 0;
        const chunkResults = await this.runWithConcurrency(chunks, async (chunk, i) => {
            console.log(`    chunk ${i + 1}/${chunks.length}...`);
            const prompt = buildUserPrompt(chunk, i + 1, chunks.length);
            return this.chatWithRetry(systemPrompt, prompt);
        }, 3);
        for (const { parsed, tokensUsed } of chunkResults) {
            allIssues.push(...parsed.issues);
            scores.push(parsed.score);
            summaries.push(parsed.summary);
            if (tokensUsed) {
                totalInput += tokensUsed.input;
                totalOutput += tokensUsed.output;
            }
        }
        // Deduplicate issues by similarity
        const uniqueIssues = this.deduplicateIssues(allIssues);
        // Average scores, merge issues, combine summaries
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return {
            parsed: {
                issues: uniqueIssues,
                score: avgScore,
                summary: summaries.length > 1
                    ? `[${chunks.length} chunks, ${allIssues.length}→${uniqueIssues.length} issues] ${summaries[0]}`
                    : summaries[0] || "No summary",
            },
            tokensUsed: { input: totalInput, output: totalOutput },
        };
    }
    /** Run async tasks with concurrency limit */
    async runWithConcurrency(items, fn, limit) {
        const results = new Array(items.length);
        let next = 0;
        async function worker() {
            while (next < items.length) {
                const i = next++;
                results[i] = await fn(items[i], i);
            }
        }
        const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
        await Promise.all(workers);
        return results;
    }
    /** Deduplicate agent issues by type+file or description similarity */
    deduplicateIssues(issues) {
        const seen = new Map();
        for (const issue of issues) {
            // Key by type + file (if available)
            const fileKey = issue.file ? `${issue.type}:${issue.file}` : null;
            // Key by first 80 chars of description (catch near-duplicates)
            const descKey = `${issue.type}:${issue.severity}:${issue.description.substring(0, 80).toLowerCase()}`;
            const key = fileKey || descKey;
            if (!seen.has(key)) {
                // Also check description similarity against existing
                let isDuplicate = false;
                for (const [, existing] of seen) {
                    if (existing.type === issue.type &&
                        existing.severity === issue.severity &&
                        this.isSimilar(existing.description, issue.description)) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    seen.set(key, issue);
                }
            }
        }
        return [...seen.values()];
    }
    /** Check if two descriptions are similar (>60% word overlap) */
    isSimilar(a, b) {
        const wordsA = new Set(a
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 3));
        const wordsB = new Set(b
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 3));
        if (wordsA.size === 0 || wordsB.size === 0)
            return false;
        let overlap = 0;
        for (const word of wordsA) {
            if (wordsB.has(word))
                overlap++;
        }
        const similarity = overlap / Math.min(wordsA.size, wordsB.size);
        return similarity > 0.6;
    }
    /** Read file contents for evaluation */
    async readFiles(filePaths) {
        const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
        const contents = new Map();
        for (const filePath of filePaths) {
            try {
                const content = await fs.readFile(filePath, "utf-8");
                contents.set(filePath, content);
            }
            catch (_error) {
                console.error(`Failed to read file: ${filePath}`);
            }
        }
        return contents;
    }
    /** Load prompt from file in prompts/ directory */
    async loadPrompt(filename) {
        const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
        const path = await Promise.resolve().then(() => __importStar(require("path")));
        const promptPath = path.resolve(__dirname, "../../prompts", filename);
        return fs.readFile(promptPath, "utf-8");
    }
    /** Truncate content if too long */
    truncateContent(content, maxChars = 50000) {
        if (content.length <= maxChars) {
            return content;
        }
        return content.slice(0, maxChars) + "\n\n... [truncated due to length]";
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base-agent.js.map