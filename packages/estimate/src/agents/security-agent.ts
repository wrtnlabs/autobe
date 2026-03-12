import { EvaluationContext } from "../types";
import { BaseAgent } from "./base-agent";
import { AgentConfig, AgentResult } from "./types";

const MAX_SECURITY_FILES = 30;

/** Security evaluation agent */
export class SecurityAgent extends BaseAgent {
  readonly name = "SecurityAgent";
  readonly description = "Evaluates code for security vulnerabilities";

  constructor(config: AgentConfig) {
    super(config);
  }

  async evaluate(context: EvaluationContext): Promise<AgentResult> {
    const startTime = performance.now();

    const allFiles = [...context.files.controllers, ...context.files.providers];

    if (allFiles.length === 0) {
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

    let targetFiles: string[];
    let sampled = false;
    if (allFiles.length > MAX_SECURITY_FILES) {
      targetFiles = this.stratifiedSample(
        context.files.controllers,
        context.files.providers,
        MAX_SECURITY_FILES,
      );
      sampled = true;
    } else {
      targetFiles = allFiles;
    }

    const fileContents = await this.readFiles(targetFiles);
    const chunks = this.splitIntoChunks(
      fileContents,
      context.project.rootPath,
      80000,
    );

    console.log(
      `  ${this.name}: ${sampled ? `${targetFiles.length}/${allFiles.length} files (sampled)` : `${targetFiles.length} files`} → ${chunks.length} chunk(s)`,
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

    const summary = sampled
      ? `[sampled ${targetFiles.length}/${allFiles.length} files] ${parsed.summary}`
      : parsed.summary;

    return {
      agent: this.name,
      provider: this.config.provider,
      model: this.client.getModel(),
      issues: parsed.issues,
      score: parsed.score,
      summary,
      durationMs: Math.round(performance.now() - startTime),
      tokensUsed,
    };
  }

  /** Stratified random sample preserving controller/provider ratio */
  private stratifiedSample(
    controllers: string[],
    providers: string[],
    maxFiles: number,
  ): string[] {
    const total = controllers.length + providers.length;
    const controllerCount = Math.max(
      1,
      Math.round((controllers.length / total) * maxFiles),
    );
    const providerCount = maxFiles - controllerCount;

    return [
      ...this.seededShuffle(controllers, total).slice(0, controllerCount),
      ...this.seededShuffle(providers, total).slice(0, providerCount),
    ];
  }

  /** Deterministic shuffle using seed (same project → same sample) */
  private seededShuffle(arr: string[], seed: number): string[] {
    const copy = [...arr];
    let s = seed;
    for (let i = copy.length - 1; i > 0; i--) {
      s = ((s * 1103515245 + 12345) & 0x7fffffff) >>> 0;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
