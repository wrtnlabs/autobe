import { EvaluationContext } from "../types";
import { BaseAgent } from "./base-agent";
import { AgentConfig, AgentResult } from "./types";

/** Security evaluation agent */
export class SecurityAgent extends BaseAgent {
  readonly name = "SecurityAgent";
  readonly description = "Evaluates code for security vulnerabilities";

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

    const fileContents = await this.readFiles(targetFiles);
    const chunks = this.splitIntoChunks(
      fileContents,
      context.project.rootPath,
      80000,
    );

    console.log(
      `  ${this.name}: ${targetFiles.length} files → ${chunks.length} chunk(s)`,
    );

    const systemPrompt = await this.loadPrompt("SECURITY_AGENT.md");

    const { parsed, tokensUsed } = await this.evaluateChunks(
      systemPrompt,
      chunks,
      (chunk, index, total) =>
        total > 1
          ? `Analyze this TypeScript/NestJS code for security vulnerabilities (chunk ${index}/${total}):\n\n${chunk}\n\nRespond ONLY with valid JSON.`
          : `Analyze this TypeScript/NestJS code for security vulnerabilities:\n\n${chunk}\n\nRespond ONLY with valid JSON.`,
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
    };
  }
}
