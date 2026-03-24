import * as fs from "fs/promises";
import * as path from "path";

import { EvaluationContext } from "../types";
import { BaseAgent } from "./base-agent";
import { AgentConfig, AgentResult } from "./types";

/** LLM Quality evaluation agent */
export class LLMQualityAgent extends BaseAgent {
  readonly name = "LLMQualityAgent";
  readonly description = "Evaluates AI-generated code for common LLM mistakes";

  constructor(config: AgentConfig) {
    super(config);
  }

  async evaluate(context: EvaluationContext): Promise<AgentResult> {
    const startTime = performance.now();

    const targetFiles = context.files.providers;

    if (targetFiles.length === 0) {
      return {
        agent: this.name,
        provider: this.config.provider,
        model: this.client.getModel(),
        issues: [],
        score: -1,
        summary: "No files to evaluate — excluded from scoring",
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    let requirementsContent = "";
    if (context.project.analysisDir) {
      try {
        const files = await fs.readdir(context.project.analysisDir);
        for (const file of files.slice(0, 5)) {
          if (file.endsWith(".md")) {
            const content = await fs.readFile(
              path.join(context.project.analysisDir, file),
              "utf-8",
            );
            requirementsContent += `\n### ${file}\n${content}\n`;
          }
        }
      } catch (error) {
        console.error("Failed to read requirements:", error);
      }
    }

    requirementsContent = this.truncateContent(requirementsContent, 20000);
    const reqSection = requirementsContent
      ? `\n## Requirements\n${requirementsContent}\n`
      : "";

    const fileContents = await this.readFiles(targetFiles);
    const chunks = this.splitIntoChunks(
      fileContents,
      context.project.rootPath,
      60000,
    );

    console.log(
      `  ${this.name}: ${targetFiles.length} files → ${chunks.length} chunk(s)`,
    );

    const systemPrompt = await this.loadPrompt("LLM_QUALITY_AGENT.md");

    const { parsed, tokensUsed } = await this.evaluateChunks(
      systemPrompt,
      chunks,
      (chunk, index, total) =>
        total > 1
          ? `Analyze this AI-generated code (chunk ${index}/${total}):${reqSection}\n## Code\n${chunk}\n\nRespond ONLY with valid JSON.`
          : `Analyze this AI-generated code:${reqSection}\n## Code\n${chunk}\n\nRespond ONLY with valid JSON.`,
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
