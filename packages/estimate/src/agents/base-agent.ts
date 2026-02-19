import { EvaluationContext } from "../types";
import { LLMClient } from "./llm-client";
import { AgentConfig, AgentIssue, AgentResult } from "./types";

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

  /** Parse JSON response from LLM */
  protected parseResponse(content: string): {
    issues: AgentIssue[];
    score: number;
    summary: string;
  } {
    try {
      let jsonStr = content;
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.replace(/```\n?/g, "");
      }
      const parsed = JSON.parse(jsonStr.trim());
      return {
        issues: parsed.issues || [],
        score: typeof parsed.score === "number" ? parsed.score : 100,
        summary: parsed.summary || "No summary provided",
      };
    } catch (_error) {
      console.error("Failed to parse agent response:", _error);
      console.error("Raw content:", content);
      return {
        issues: [],
        score: 0,
        summary: "Failed to parse agent response",
      };
    }
  }

  /** Chat with retry on parse failure */
  protected async chatWithRetry(
    systemPrompt: string,
    userPrompt: string,
    maxRetries: number = 2,
  ): Promise<{
    parsed: { issues: AgentIssue[]; score: number; summary: string };
    tokensUsed?: { input: number; output: number };
  }> {
    let lastError: string = "";
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.chat(systemPrompt, userPrompt);
        const parsed = this.parseResponse(response.content);
        if (
          parsed.summary === "Failed to parse agent response" &&
          attempt < maxRetries
        ) {
          lastError = "JSON parse failed";
          console.log(
            `  ↻ ${this.name} retry ${attempt + 1}/${maxRetries} (${lastError})`,
          );
          continue;
        }
        return { parsed, tokensUsed: response.tokensUsed };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        if (attempt < maxRetries) {
          console.log(
            `  ↻ ${this.name} retry ${attempt + 1}/${maxRetries} (${lastError})`,
          );
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
  protected splitIntoChunks(
    fileContents: Map<string, string>,
    rootPath: string,
    maxChars: number = 30000,
  ): string[] {
    const path = require("path");
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
  ): Promise<{
    parsed: { issues: AgentIssue[]; score: number; summary: string };
    tokensUsed?: { input: number; output: number };
  }> {
    if (chunks.length <= 1) {
      const prompt = buildUserPrompt(chunks[0] || "", 1, 1);
      return this.chatWithRetry(systemPrompt, prompt);
    }

    const allIssues: AgentIssue[] = [];
    const scores: number[] = [];
    const summaries: string[] = [];
    let totalInput = 0;
    let totalOutput = 0;

    const chunkResults = await Promise.all(
      chunks.map(async (chunk, i) => {
        console.log(`    chunk ${i + 1}/${chunks.length}...`);
        const prompt = buildUserPrompt(chunk, i + 1, chunks.length);
        return this.chatWithRetry(systemPrompt, prompt);
      }),
    );

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
    const avgScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );

    return {
      parsed: {
        issues: uniqueIssues,
        score: avgScore,
        summary:
          summaries.length > 1
            ? `[${chunks.length} chunks, ${allIssues.length}→${uniqueIssues.length} issues] ${summaries[0]}`
            : summaries[0] || "No summary",
      },
      tokensUsed: { input: totalInput, output: totalOutput },
    };
  }

  /** Deduplicate agent issues by type+file or description similarity */
  protected deduplicateIssues(issues: AgentIssue[]): AgentIssue[] {
    const seen = new Map<string, AgentIssue>();

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
