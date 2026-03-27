import * as path from "path";

import { EvaluationContext } from "../types";
import { LLMClient } from "./llm-client";
import {
  AgentChunkResult,
  AgentConfig,
  AgentIssue,
  AgentParseResult,
  AgentResult,
  DeepEvalScores,
} from "./types";

/** Base class for AI evaluation agents */
export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly description: string;
  protected client: LLMClient;
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new LLMClient(config);
  }

  /** Run the agent evaluation */
  abstract evaluate(context: EvaluationContext): Promise<AgentResult>;

  /**
   * Extract the first JSON object from a string, handling markdown fences and
   * surrounding text
   */
  private extractJson(raw: string): string {
    // 1. Try to extract from markdown code fence (```json ... ``` or ``` ... ```)
    const fenceMatch = raw.match(/```(?:json)?\s*\r?\n?([\s\S]*?)```/);
    if (fenceMatch) return fenceMatch[1].trim();

    // 2. Try to extract the first top-level { ... } or [ ... ] block
    const firstBrace = raw.indexOf("{");
    const firstBracket = raw.indexOf("[");
    const start =
      firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)
        ? firstBrace
        : firstBracket;
    if (start >= 0) {
      const open = raw[start];
      const close = open === "{" ? "}" : "]";
      let depth = 0;
      let inString = false;
      let escape = false;
      for (let i = start; i < raw.length; i++) {
        const ch = raw[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (ch === open) depth++;
        else if (ch === close) {
          depth--;
          if (depth === 0) return raw.slice(start, i + 1);
        }
      }
    }

    // 3. Fallback: return trimmed input as-is
    return raw.trim();
  }

  /** Parse JSON response from LLM */
  protected parseResponse(content: string): AgentParseResult {
    try {
      const jsonStr = this.extractJson(content);
      const parsed = JSON.parse(jsonStr);
      // Sanitize issues: ensure each has required string fields
      const rawIssues: AgentIssue[] = (parsed.issues || [])
        .filter((i: unknown) => i && typeof i === "object")
        .map((i: Record<string, unknown>) => ({
          ...i,
          description:
            typeof i.description === "string"
              ? i.description
              : String(i.description ?? "No description"),
          type: typeof i.type === "string" ? i.type : "unknown",
          severity: typeof i.severity === "string" ? i.severity : "warning",
        }));
      const result: AgentParseResult = {
        issues: rawIssues,
        score:
          typeof parsed.score === "number"
            ? Math.max(0, Math.min(100, parsed.score))
            : 100,
        summary:
          typeof parsed.summary === "string"
            ? parsed.summary
            : "No summary provided",
      };
      if (parsed.deepEvalScores) {
        const d = parsed.deepEvalScores;
        result.deepEvalScores = {
          faithfulness: typeof d.faithfulness === "number" ? d.faithfulness : 0,
          relevancy: typeof d.relevancy === "number" ? d.relevancy : 0,
          contextualPrecision:
            typeof d.contextualPrecision === "number"
              ? d.contextualPrecision
              : 0,
        };
      }
      return result;
    } catch (_error) {
      const preview = content.slice(0, 200).replace(/\n/g, "\\n");
      console.error(
        `  ⚠ ${this.constructor.name}: JSON parse failed — preview: ${preview}`,
      );
      return {
        issues: [],
        score: 0,
        summary: "Failed to parse agent response",
      };
    }
  }

  /** Chat with retry on parse failure (exponential backoff) */
  protected async chatWithRetry(
    systemPrompt: string,
    userPrompt: string,
    maxRetries: number = 3,
  ): Promise<AgentChunkResult> {
    let lastError: string = "";
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat(systemPrompt, userPrompt);

        // Detect empty/terminated responses from provider
        if (!response.content || response.content.trim().length === 0) {
          lastError = "Empty response (possibly terminated by provider)";
          if (attempt < maxRetries) {
            const delay = Math.min(30_000, 3_000 * Math.pow(2, attempt));
            console.log(
              `  ↻ ${this.name} retry ${attempt + 1}/${maxRetries} (${lastError}, backoff ${Math.round(delay / 1000)}s)`,
            );
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          // All retries exhausted — mark as API failure
          break;
        }

        const parsed = this.parseResponse(response.content);
        if (parsed.summary === "Failed to parse agent response") {
          if (attempt < maxRetries) {
            lastError = "JSON parse failed";
            const delay = Math.min(30_000, 3_000 * Math.pow(2, attempt));
            console.log(
              `  ↻ ${this.name} retry ${attempt + 1}/${maxRetries} (${lastError}, backoff ${Math.round(delay / 1000)}s)`,
            );
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          // Last attempt parse failure → mark as failed (-1), not score=0
          lastError = "JSON parse failed on final attempt";
          break;
        }
        return { parsed, tokensUsed: response.tokensUsed };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        if (attempt < maxRetries) {
          const delay = Math.min(30_000, 3_000 * Math.pow(2, attempt));
          console.log(
            `  ↻ ${this.name} retry ${attempt + 1}/${maxRetries} (${lastError}, backoff ${Math.round(delay / 1000)}s)`,
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
    }
    console.log(
      `  ✗ ${this.name}: ${lastError} — marking as API failure (score -1)`,
    );
    return {
      parsed: {
        issues: [],
        score: -1,
        summary: `API failure after ${maxRetries + 1} attempts: ${lastError}`,
      },
    };
  }

  /** Split file map into chunks that fit within maxChars */
  protected splitIntoChunks(
    fileContents: Map<string, string>,
    rootPath: string,
    maxChars: number = 30000,
  ): string[] {
    const chunks: string[] = [];
    let current = "";

    for (const [filePath, content] of fileContents) {
      const relativePath = path.relative(rootPath, filePath);
      const block = `\n### File: ${relativePath}\n\`\`\`typescript\n${content}\n\`\`\`\n`;

      if (current.length + block.length > maxChars && current.length > 0) {
        chunks.push(current);
        current = block;
      } else {
        current += block;
      }
    }

    if (current.length > 0) {
      chunks.push(current);
    }

    return chunks;
  }

  /** Evaluate multiple chunks and merge results */
  protected async evaluateChunks(
    systemPrompt: string,
    chunks: string[],
    buildUserPrompt: (chunk: string, index: number, total: number) => string,
  ): Promise<AgentChunkResult> {
    if (chunks.length <= 1) {
      const prompt = buildUserPrompt(chunks[0] || "", 1, 1);
      return this.chatWithRetry(systemPrompt, prompt);
    }

    const allIssues: AgentIssue[] = [];
    const scores: number[] = [];
    const summaries: string[] = [];
    let totalInput = 0;
    let totalOutput = 0;
    let totalInputCost = 0;
    let totalOutputCost = 0;

    const chunkResults = await this.runWithConcurrency(
      chunks,
      async (chunk, i) => {
        console.log(`    chunk ${i + 1}/${chunks.length}...`);
        const prompt = buildUserPrompt(chunk, i + 1, chunks.length);
        return this.chatWithRetry(systemPrompt, prompt);
      },
      3, // max 3 concurrent requests
    );

    const deepEvalSamples: DeepEvalScores[] = [];

    let failedChunks = 0;
    for (const { parsed, tokensUsed } of chunkResults) {
      if (parsed.score < 0) {
        failedChunks++;
      } else {
        allIssues.push(...parsed.issues);
        scores.push(parsed.score);
        if (parsed.deepEvalScores) deepEvalSamples.push(parsed.deepEvalScores);
      }
      summaries.push(parsed.summary);

      if (tokensUsed) {
        totalInput += tokensUsed.input;
        totalOutput += tokensUsed.output;
        totalInputCost += tokensUsed.inputCost || 0;
        totalOutputCost += tokensUsed.outputCost || 0;
      }
    }

    // Deduplicate issues by similarity
    const uniqueIssues = this.deduplicateIssues(allIssues);

    // If all chunks failed, mark entire agent as failed
    if (scores.length === 0) {
      return {
        parsed: {
          issues: [],
          score: -1,
          summary: `All ${failedChunks} chunks failed due to API errors`,
        },
        tokensUsed: {
          input: totalInput,
          output: totalOutput,
          inputCost: totalInputCost || undefined,
          outputCost: totalOutputCost || undefined,
        },
      };
    }

    // If >50% chunks failed, mark as failed — too unreliable for scoring
    if (failedChunks > 0 && failedChunks / chunks.length > 0.5) {
      console.log(
        `  ⚠ ${this.name}: ${failedChunks}/${chunks.length} chunks failed — marking agent as unreliable`,
      );
      return {
        parsed: {
          issues: uniqueIssues,
          score: -1,
          summary: `${failedChunks}/${chunks.length} chunks failed due to API errors`,
        },
        tokensUsed: {
          input: totalInput,
          output: totalOutput,
          inputCost: totalInputCost || undefined,
          outputCost: totalOutputCost || undefined,
        },
      };
    }

    // Average only successful chunk scores
    const avgScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );
    if (failedChunks > 0) {
      console.log(
        `  ⚠ ${this.name}: ${failedChunks}/${chunks.length} chunks failed, averaging ${scores.length} successful chunks`,
      );
    }

    // Average DeepEval sub-scores across chunks
    const mergedDeepEval: DeepEvalScores | undefined =
      deepEvalSamples.length > 0
        ? {
            faithfulness: Math.round(
              deepEvalSamples.reduce((s, d) => s + d.faithfulness, 0) /
                deepEvalSamples.length,
            ),
            relevancy: Math.round(
              deepEvalSamples.reduce((s, d) => s + d.relevancy, 0) /
                deepEvalSamples.length,
            ),
            contextualPrecision: Math.round(
              deepEvalSamples.reduce((s, d) => s + d.contextualPrecision, 0) /
                deepEvalSamples.length,
            ),
          }
        : undefined;

    return {
      parsed: {
        issues: uniqueIssues,
        score: avgScore,
        summary:
          summaries.length > 1
            ? `[${chunks.length} chunks, ${allIssues.length}→${uniqueIssues.length} issues] ${summaries[0]}`
            : summaries[0] || "No summary",
        deepEvalScores: mergedDeepEval,
      },
      tokensUsed: {
        input: totalInput,
        output: totalOutput,
        inputCost: totalInputCost || undefined,
        outputCost: totalOutputCost || undefined,
      },
    };
  }

  /** Run async tasks with concurrency limit */
  protected async runWithConcurrency<T, R>(
    items: T[],
    fn: (item: T, index: number) => Promise<R>,
    limit: number,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;

    async function worker() {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
      worker(),
    );
    await Promise.all(workers);

    return results;
  }

  /** Deduplicate agent issues by type+file or description similarity */
  protected deduplicateIssues(issues: AgentIssue[]): AgentIssue[] {
    const seen = new Map<string, AgentIssue>();

    for (const issue of issues) {
      // Key by type + file (if available)
      const fileKey = issue.file ? `${issue.type}:${issue.file}` : null;

      // Key by first 80 chars of description (catch near-duplicates)
      const desc = issue.description || "";
      const descKey = `${issue.type}:${issue.severity}:${desc.substring(0, 80).toLowerCase()}`;

      const key = fileKey || descKey;

      if (!seen.has(key)) {
        // Also check description similarity against existing
        let isDuplicate = false;
        for (const [, existing] of seen) {
          if (
            existing.type === issue.type &&
            existing.severity === issue.severity &&
            this.isSimilar(existing.description, issue.description)
          ) {
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
  private isSimilar(a: string, b: string): boolean {
    const wordsA = new Set(
      a
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
    const wordsB = new Set(
      b
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
    if (wordsA.size === 0 || wordsB.size === 0) return false;

    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) overlap++;
    }

    const similarity = overlap / Math.min(wordsA.size, wordsB.size);
    return similarity > 0.6;
  }

  /** Read file contents for evaluation */
  protected async readFiles(filePaths: string[]): Promise<Map<string, string>> {
    const fs = await import("fs/promises");
    const contents = new Map<string, string>();
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, "utf-8");
        contents.set(filePath, content);
      } catch (_error) {
        console.error(`Failed to read file: ${filePath}`);
      }
    }
    return contents;
  }

  /** Load prompt from file in prompts/ directory */
  protected async loadPrompt(filename: string): Promise<string> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const promptPath = path.resolve(__dirname, "../../prompts", filename);
    return fs.readFile(promptPath, "utf-8");
  }

  /** Truncate content if too long */
  protected truncateContent(content: string, maxChars: number = 50000): string {
    if (content.length <= maxChars) {
      return content;
    }
    return content.slice(0, maxChars) + "\n\n... [truncated due to length]";
  }
}
