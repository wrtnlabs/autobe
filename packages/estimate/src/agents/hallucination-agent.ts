import * as fs from "fs/promises";
import * as path from "path";

import { EvaluationContext } from "../types";
import { BaseAgent } from "./base-agent";
import { AgentConfig, AgentResult } from "./types";

const MAX_SPEC_CHARS = 30000;

/** Hallucination detection agent — compares implementation against spec */
export class HallucinationAgent extends BaseAgent {
  readonly name = "HallucinationAgent";
  readonly description =
    "Detects hallucinations by comparing code against OpenAPI spec and Prisma schema";

  constructor(config: AgentConfig) {
    super(config);
  }

  async evaluate(context: EvaluationContext): Promise<AgentResult> {
    const startTime = performance.now();

    const targetFiles = [
      ...context.files.controllers,
      ...context.files.providers,
    ];

    if (targetFiles.length === 0) {
      return {
        agent: this.name,
        provider: this.config.provider,
        model: this.client.getModel(),
        issues: [],
        score: 100,
        summary: "No files to evaluate",
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    // Load ground truth: OpenAPI spec + Prisma schema
    const specContext = await this.loadSpecContext(context);

    if (!specContext) {
      return {
        agent: this.name,
        provider: this.config.provider,
        model: this.client.getModel(),
        issues: [],
        score: 100,
        summary: "No spec context available (OpenAPI/Prisma not found)",
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    const fileContents = await this.readFiles(targetFiles);
    const chunks = this.splitIntoChunks(
      fileContents,
      context.project.rootPath,
      60000,
    );

    console.log(
      `  ${this.name}: ${targetFiles.length} files → ${chunks.length} chunk(s)`,
    );

    const systemPrompt = await this.loadPrompt("HALLUCINATION_AGENT.md");

    const { parsed, tokensUsed } = await this.evaluateChunks(
      systemPrompt,
      chunks,
      (chunk, index, total) =>
        total > 1
          ? `Compare this implementation against the spec (chunk ${index}/${total}):\n\n## Ground Truth\n${specContext}\n\n## Implementation\n${chunk}\n\nRespond ONLY with valid JSON.`
          : `Compare this implementation against the spec:\n\n## Ground Truth\n${specContext}\n\n## Implementation\n${chunk}\n\nRespond ONLY with valid JSON.`,
    );

    return {
      agent: this.name,
      provider: this.config.provider,
      model: this.client.getModel(),
      issues: parsed.issues,
      score: parsed.score,
      summary: parsed.summary,
      durationMs: Math.round(performance.now() - startTime),
      tokensUsed,
      deepEvalScores: parsed.deepEvalScores,
    };
  }

  /** Load OpenAPI spec + Prisma schema as ground truth context */
  private async loadSpecContext(
    context: EvaluationContext,
  ): Promise<string | null> {
    const parts: string[] = [];
    const rootPath = context.project.rootPath;

    // 1. OpenAPI / Swagger spec
    const specCandidates = [
      path.join(rootPath, "swagger.json"),
      path.join(rootPath, "openapi.json"),
      path.join(rootPath, "docs", "swagger.json"),
      path.join(rootPath, "docs", "openapi.json"),
      path.join(rootPath, "output", "swagger.json"),
    ];

    for (const specPath of specCandidates) {
      try {
        const content = await fs.readFile(specPath, "utf-8");
        parts.push(`### OpenAPI Specification\n\`\`\`json\n${content}\n\`\`\``);
        break;
      } catch {
        // file not found, try next
      }
    }

    // 2. Prisma schema
    for (const schemaPath of context.files.prismaSchemas) {
      try {
        const content = await fs.readFile(schemaPath, "utf-8");
        const relativePath = path.relative(rootPath, schemaPath);
        parts.push(
          `### Prisma Schema (${relativePath})\n\`\`\`prisma\n${content}\n\`\`\``,
        );
      } catch {
        // skip unreadable schema
      }
    }

    if (parts.length === 0) return null;

    const combined = parts.join("\n\n");
    return this.truncateContent(combined, MAX_SPEC_CHARS);
  }
}
