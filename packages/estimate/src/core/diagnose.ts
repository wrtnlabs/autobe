import * as fs from "fs";
import * as path from "path";

import { LLMClient } from "../agents/llm-client";
import type { LLMProvider, TokenUsage } from "../agents/types";
import type { EvaluationResult, Issue } from "../types";

/** Default model for diagnosis (cheap, good at code analysis) */
export const DIAGNOSE_MODEL = "deepseek/deepseek-v3.2";

export interface DiagnoseOptions {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  verbose?: boolean;
}

export interface DiagnoseResult {
  markdown: string;
  totalErrors: number;
  filesAnalyzed: number;
  tokensUsed: TokenUsage;
  durationMs: number;
}

interface ErrorGroup {
  file: string;
  errors: string[];
  sourceCode?: string;
}

/**
 * Run compile error diagnosis on evaluation results.
 *
 * Collects gate-phase compile errors, reads related source code and schemas,
 * then calls LLM to perform 7-step forensic analysis for each error file.
 */
export async function runDiagnosis(
  result: EvaluationResult,
  targetPath: string,
  options: DiagnoseOptions,
): Promise<DiagnoseResult> {
  const startTime = performance.now();
  const log = (msg: string) => {
    if (options.verbose) console.log(msg);
  };

  // 1. Collect compile errors from gate phase
  const gateIssues = result.phases.gate.issues.filter(
    (i) => i.severity === "critical" || i.severity === "warning",
  );

  if (gateIssues.length === 0) {
    return {
      markdown: buildEmptyDiagnosis(result),
      totalErrors: 0,
      filesAnalyzed: 0,
      tokensUsed: { input: 0, output: 0 },
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // 2. Group errors by file
  const groups = groupErrorsByFile(gateIssues);
  log(
    `[Diagnose] ${groups.length} files with errors, ${gateIssues.length} total issues`,
  );

  // 3. Read source code for each error file
  for (const group of groups) {
    group.sourceCode = readSourceSafe(targetPath, group.file);
  }

  // 4. Read context files (Prisma schemas, DTO types)
  const prismaSchemas = readPrismaSchemas(targetPath);
  const dtoTypes = readDtoTypes(targetPath);

  log(
    `[Diagnose] Context: ${prismaSchemas.length} chars schema, ${dtoTypes.length} chars DTO`,
  );

  // 5. Call LLM for diagnosis
  const systemPrompt = loadDiagnosePrompt();
  const userPrompt = buildUserPrompt(result, groups, prismaSchemas, dtoTypes);

  log(`[Diagnose] Calling LLM (${options.model || DIAGNOSE_MODEL})...`);

  const client = new LLMClient({
    provider: options.provider,
    apiKey: options.apiKey,
    model: options.model || DIAGNOSE_MODEL,
    maxTokens: options.maxTokens || 16384,
  });

  const response = await client.chat(systemPrompt, userPrompt, { json: false });

  log(
    `[Diagnose] LLM response: ${response.tokensUsed.input} in / ${response.tokensUsed.output} out tokens`,
  );

  // 6. Build final markdown
  const markdown = buildDiagnosisReport(
    result,
    response.content,
    groups.length,
  );

  return {
    markdown,
    totalErrors: gateIssues.length,
    filesAnalyzed: groups.length,
    tokensUsed: response.tokensUsed,
    durationMs: Math.round(performance.now() - startTime),
  };
}

/** Group issues by file path */
function groupErrorsByFile(issues: Issue[]): ErrorGroup[] {
  const map = new Map<string, string[]>();

  for (const issue of issues) {
    const file = issue.location?.file || "unknown";
    const existing = map.get(file) || [];
    existing.push(`[${issue.code}] ${issue.message}`);
    map.set(file, existing);
  }

  return Array.from(map.entries()).map(([file, errors]) => ({
    file,
    errors,
  }));
}

/** Read source file safely */
function readSourceSafe(targetPath: string, file: string): string | undefined {
  try {
    const filePath = path.isAbsolute(file) ? file : path.join(targetPath, file);
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

/** Read all Prisma schema files */
function readPrismaSchemas(targetPath: string): string {
  const schemaDir = path.join(targetPath, "prisma", "schema");
  const singleFile = path.join(targetPath, "prisma", "schema.prisma");

  const parts: string[] = [];

  if (fs.existsSync(schemaDir)) {
    try {
      const files = fs
        .readdirSync(schemaDir)
        .filter((f) => f.endsWith(".prisma"));
      for (const f of files) {
        const content = fs.readFileSync(path.join(schemaDir, f), "utf-8");
        parts.push(`// --- ${f} ---\n${content}`);
      }
    } catch {
      // ignore
    }
  } else if (fs.existsSync(singleFile)) {
    try {
      parts.push(fs.readFileSync(singleFile, "utf-8"));
    } catch {
      // ignore
    }
  }

  return parts.join("\n\n");
}

/** Read API DTO type files */
function readDtoTypes(targetPath: string): string {
  const structuresDir = path.join(targetPath, "src", "api", "structures");
  if (!fs.existsSync(structuresDir)) return "";

  const parts: string[] = [];
  try {
    const files = fs
      .readdirSync(structuresDir)
      .filter((f) => f.endsWith(".ts"));
    for (const f of files.slice(0, 50)) {
      // limit to 50 files
      const content = fs.readFileSync(path.join(structuresDir, f), "utf-8");
      parts.push(`// --- ${f} ---\n${content}`);
    }
  } catch {
    // ignore
  }

  return parts.join("\n\n");
}

/** Load diagnose system prompt */
function loadDiagnosePrompt(): string {
  const promptPath = path.join(__dirname, "../../prompts/DIAGNOSE_AGENT.md");
  try {
    return fs.readFileSync(promptPath, "utf-8");
  } catch {
    // Fallback for built output
    const altPath = path.join(__dirname, "../../../prompts/DIAGNOSE_AGENT.md");
    try {
      return fs.readFileSync(altPath, "utf-8");
    } catch {
      return "You are a TypeScript compilation error diagnostician. Analyze each error with 7-step forensic analysis: 1) Error message 2) DB Schema 3) DTO Spec 4) Problem code 5) Root cause 6) Corrected code 7) Recommendations. Output as markdown.";
    }
  }
}

/** Build the user prompt with all context */
function buildUserPrompt(
  result: EvaluationResult,
  groups: ErrorGroup[],
  prismaSchemas: string,
  dtoTypes: string,
): string {
  const parts: string[] = [];

  parts.push(`# Project: ${path.basename(result.targetPath)}`);
  parts.push(`Total score: ${result.totalScore}/100 (Grade: ${result.grade})`);
  parts.push(
    `Gate score: ${result.phases.gate.score}/100 (${result.phases.gate.passed ? "PASSED" : "FAILED"})`,
  );
  parts.push("");

  // Compile errors
  parts.push("## Compile Errors\n");
  for (const group of groups) {
    parts.push(`### \`${group.file}\``);
    for (const err of group.errors) {
      parts.push(`- ${err}`);
    }
    parts.push("");
  }

  // Source code for error files
  parts.push("## Source Code of Error Files\n");
  for (const group of groups) {
    if (group.sourceCode) {
      parts.push(`### \`${group.file}\`\n`);
      parts.push("```typescript");
      parts.push(truncate(group.sourceCode, 8000));
      parts.push("```\n");
    }
  }

  // Prisma schemas
  if (prismaSchemas) {
    parts.push("## Prisma Schema\n");
    parts.push("```prisma");
    parts.push(truncate(prismaSchemas, 12000));
    parts.push("```\n");
  }

  // DTO types
  if (dtoTypes) {
    parts.push("## API DTO Types\n");
    parts.push("```typescript");
    parts.push(truncate(dtoTypes, 10000));
    parts.push("```\n");
  }

  parts.push("---");
  parts.push(
    "Analyze ALL error files above using the 7-step forensic analysis. Do not skip any file.",
  );

  return parts.join("\n");
}

/** Truncate content to max characters */
function truncate(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + "\n... (truncated)";
}

/** Build empty diagnosis for projects with no errors */
function buildEmptyDiagnosis(result: EvaluationResult): string {
  return `# Compile Error Diagnosis

> **Project**: ${path.basename(result.targetPath)}
> **Score**: ${result.totalScore}/100 (Grade: ${result.grade})
> **Gate**: ${result.phases.gate.score}/100

No compile errors found. The project passes gate validation successfully.
`;
}

/** Wrap LLM analysis in a full diagnosis report */
function buildDiagnosisReport(
  result: EvaluationResult,
  llmAnalysis: string,
  filesAnalyzed: number,
): string {
  const header = `# Compile Error Diagnosis

> **Project**: ${path.basename(result.targetPath)}
> **Score**: ${result.totalScore}/100 (Grade: ${result.grade})
> **Gate**: ${result.phases.gate.score}/100 (${result.phases.gate.passed ? "PASSED with penalties" : "FAILED"})
> **Error files analyzed**: ${filesAnalyzed}
> **Generated**: ${new Date().toISOString()}

---

`;

  return header + llmAnalysis;
}
