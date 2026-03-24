import * as fs from "fs";

import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { PHASE_WEIGHTS, createIssue } from "../../types";
import { BaseEvaluator } from "../base";

export class LogicCompletenessEvaluator extends BaseEvaluator {
  readonly name = "LogicCompletenessEvaluator";
  readonly phase = "logicCompleteness" as const;
  readonly description = "Checks for incomplete implementations";

  private readonly INCOMPLETE_PATTERNS = [
    {
      pattern: /throw\s+new\s+Error\s*\(\s*['"`]not\s*implemented['"`]\s*\)/gi,
      code: "LOGIC001",
      message: 'Unimplemented code: throw new Error("not implemented")',
    },
    {
      pattern: /\/\/\s*TODO\s*:/gi,
      code: "LOGIC002",
      message: "TODO comment found",
    },
    {
      pattern: /\/\/\s*FIXME\s*:/gi,
      code: "LOGIC003",
      message: "FIXME comment found (indicates known bug)",
    },
    {
      pattern: /\/\/\s*HACK\s*:/gi,
      code: "LOGIC004",
      message: "HACK comment found",
    },
    {
      pattern: /\/\/\s*implement\s*this/gi,
      code: "LOGIC005",
      message: "Unimplemented placeholder found",
    },
    {
      pattern: /throw\s+new\s+Error\s*\(\s*['"`]TODO['"`]\s*\)/gi,
      code: "LOGIC006",
      message: "TODO error placeholder",
    },
    {
      pattern: /notImplemented\s*\(\s*\)/gi,
      code: "LOGIC007",
      message: "notImplemented() call found",
    },
    {
      pattern: /return\s+null\s*as\s+any/gi,
      code: "LOGIC010",
      message: "Suspicious null cast to any — likely incomplete implementation",
    },
    {
      pattern: /\bxit\s*\(/gi,
      code: "LOGIC013",
      message: "Skipped test (xit) found — test not being executed",
    },
    {
      pattern: /\bit\.skip\s*\(/gi,
      code: "LOGIC014",
      message: "Skipped test (it.skip) found — test not being executed",
    },
    {
      pattern: /\bxdescribe\s*\(/gi,
      code: "LOGIC015",
      message: "Skipped test suite (xdescribe) found — entire suite disabled", // typos:ignore
    },
    {
      pattern: /\bdescribe\.skip\s*\(/gi,
      code: "LOGIC016",
      message:
        "Skipped test suite (describe.skip) found — entire suite disabled",
    },
    {
      pattern: /Promise\.resolve\s*\(\s*(?:null|undefined|\{\}|\[\])\s*\)/gi,
      code: "LOGIC011",
      message: "Stub async return — Promise resolves with empty value",
    },
    {
      pattern:
        /console\.log\s*\(\s*['"`](?:debug|test|temp|check|xxx|TODO)\b/gi,
      code: "LOGIC012",
      message: "Debug console.log left in production code",
    },
  ];

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
    ];

    const results = await Promise.all(
      filesToCheck.map((filePath) => this.analyzeFile(filePath)),
    );

    const issues = results.flatMap((r) => r);
    const criticalCount = issues.filter(
      (i) => i.severity === "critical",
    ).length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    // Continuous scoring: criticals cost 7 pts each, warnings cost 2 pts each.
    // No cliffs — smooth degradation. Floor at 0.
    const score = Math.max(0, 100 - criticalCount * 7 - warningCount * 2);

    return {
      phase: "logicCompleteness",
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * PHASE_WEIGHTS.logicCompleteness,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalIncomplete: issues.length,
        criticalCount,
        warningCount,
        todoCount: issues.filter((i) => i.code === "LOGIC002").length,
        fixmeCount: issues.filter((i) => i.code === "LOGIC003").length,
        emptyMethods: issues.filter((i) => i.code === "LOGIC008").length,
        emptyCatch: issues.filter((i) => i.code === "LOGIC009").length,
      },
    };
  }

  private async analyzeFile(filePath: string): Promise<Issue[]> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const lines = content.split("\n");
      const issues: Issue[] = [];

      // Pattern-based checks (line by line)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip lines that are inside string literals (starts with quote after trimming,
        // or is a template literal continuation, or is a JSDoc/block comment line)
        const trimmed = line.trim();
        if (
          /^\*/.test(trimmed) || // JSDoc / block comment continuation
          /^\/\*\*/.test(trimmed) // block comment start
        ) {
          continue;
        }

        for (const { pattern, code, message } of this.INCOMPLETE_PATTERNS) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            // TODO, FIXME, HACK comments are warnings (annotations, not broken code);
            // LOGIC012 (debug console.log) is also a warning — not a showstopper.
            const severity =
              code === "LOGIC002" ||
              code === "LOGIC003" ||
              code === "LOGIC004" ||
              code === "LOGIC011" ||
              code === "LOGIC012" ||
              code === "LOGIC013" ||
              code === "LOGIC014" ||
              code === "LOGIC015" ||
              code === "LOGIC016"
                ? "warning"
                : "critical";
            issues.push(
              createIssue({
                severity,
                category: "completeness",
                code,
                message,
                location: { file: filePath, line: i + 1 },
              }),
            );
          }
        }
      }

      // Structural checks (full content)
      this.checkEmptyMethods(content, filePath, issues);
      this.checkEmptyCatch(content, filePath, issues);
      this.checkStubReturns(content, filePath, issues);
      this.checkPassthroughMethods(content, filePath, issues);
      this.checkBoilerplateSimilarity(content, filePath, issues);
      this.checkPrismaOnlyProvider(content, filePath, issues);

      return issues;
    } catch (error) {
      console.error(`Failed to analyze file ${filePath}:`, error);
      return [];
    }
  }

  private static readonly CONTROL_KEYWORDS = new Set([
    "if",
    "else",
    "for",
    "while",
    "switch",
    "catch",
    "try",
    "do",
  ]);

  /**
   * Known NestJS lifecycle / decorator callback names that are legitimately
   * empty
   */
  private static readonly LIFECYCLE_METHODS = new Set([
    "onModuleInit",
    "onModuleDestroy",
    "onApplicationBootstrap",
    "onApplicationShutdown",
    "beforeApplicationShutdown",
  ]);

  /**
   * Detect empty method bodies: async methodName(...) { } Skips arrow-function
   * callbacks, decorator arguments, and NestJS lifecycle hooks.
   */
  private checkEmptyMethods(
    content: string,
    filePath: string,
    issues: Issue[],
  ): void {
    // Match empty method bodies, handling generic return types like Promise<Foo<Bar>>
    // by using a non-greedy match that stops at the opening brace of the body.
    const emptyMethodPattern =
      /(?:async\s+)?(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^{]*?)?\s*\{\s*\n?\s*\}/g;
    let match;
    while ((match = emptyMethodPattern.exec(content)) !== null) {
      const name = match[1];
      // Skip control-flow keywords
      if (LogicCompletenessEvaluator.CONTROL_KEYWORDS.has(name)) continue;
      // Skip NestJS lifecycle hooks (legitimately empty)
      if (LogicCompletenessEvaluator.LIFECYCLE_METHODS.has(name)) continue;
      // Skip if preceded by `=>`, `=`, or `,` — likely a callback or object method
      const before = content.substring(
        Math.max(0, match.index - 20),
        match.index,
      );
      if (/[=>,]\s*$/.test(before)) continue;
      // Skip if preceded by `@` decorator line (e.g. @Module({ ... }))
      if (/@\w+\s*\(\s*$/.test(before)) continue;

      const line = content.substring(0, match.index).split("\n").length;
      issues.push(
        createIssue({
          severity: "critical",
          category: "completeness",
          code: "LOGIC008",
          message: "Empty method body found",
          location: { file: filePath, line },
        }),
      );
    }
  }

  /**
   * Detect empty catch blocks: catch (...) { } Skips catch blocks with
   * intentional-empty comments.
   */
  private checkEmptyCatch(
    content: string,
    filePath: string,
    issues: Issue[],
  ): void {
    const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{(\s*\n?\s*)\}/g;
    let match;
    while ((match = emptyCatchPattern.exec(content)) !== null) {
      // Check surrounding context for intentional-empty indicators
      const bodyArea = content.substring(
        match.index,
        match.index + match[0].length + 30,
      );
      if (/\/[/*]\s*(intentional|ignore|skip|noop|expected)/i.test(bodyArea)) {
        continue;
      }
      const line = content.substring(0, match.index).split("\n").length;
      issues.push(
        createIssue({
          severity: "warning",
          category: "completeness",
          code: "LOGIC009",
          message: "Empty catch block — errors silently swallowed",
          location: { file: filePath, line },
        }),
      );
    }
  }

  /** Detect stub return values: return {} or return [] as only statement */
  private checkStubReturns(
    content: string,
    filePath: string,
    issues: Issue[],
  ): void {
    // Match methods whose body is just `return {};` or `return [];` or `return null;`
    const stubReturnPattern =
      /(?:async\s+)?(?:\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{\s*return\s+(?:\{\}|\[\]|null|undefined|0|false|''|"")\s*;?\s*\}/g;
    let match;
    while ((match = stubReturnPattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split("\n").length;
      issues.push(
        createIssue({
          severity: "critical",
          category: "completeness",
          code: "LOGIC020",
          message: "Stub return value — method returns empty object/array/null",
          location: { file: filePath, line },
        }),
      );
    }
  }

  /**
   * Detect passthrough methods whose entire body is a single delegation call.
   * e.g. `async create(input) { return this.service.create(input); }` These
   * indicate the provider/controller has no real business logic.
   */
  private checkPassthroughMethods(
    content: string,
    filePath: string,
    issues: Issue[],
  ): void {
    const funcStart = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
    // Single return+await delegation: the body is only `return (await)? this.xxx.yyy(...);`
    const passthroughBody =
      /^\s*return\s+(?:await\s+)?this\.\w+\.\w+\s*\([^)]*\)\s*;?\s*$/;

    let m;
    let passthroughCount = 0;
    let totalMethods = 0;
    while ((m = funcStart.exec(content)) !== null) {
      const name = m[1];
      if (LogicCompletenessEvaluator.CONTROL_KEYWORDS.has(name)) continue;
      if (LogicCompletenessEvaluator.LIFECYCLE_METHODS.has(name)) continue;

      const bodyStart = m.index + m[0].length;
      let depth = 1;
      let i = bodyStart;
      while (i < content.length && depth > 0) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) continue;

      totalMethods++;
      const body = content.substring(bodyStart, i - 1).trim();
      if (passthroughBody.test(body)) {
        passthroughCount++;
      }
    }

    // Flag when >80% of methods are pure passthrough (minimum 3 methods)
    if (totalMethods >= 3 && passthroughCount / totalMethods > 0.8) {
      issues.push(
        createIssue({
          severity: "warning",
          category: "completeness",
          code: "LOGIC017",
          message: `${passthroughCount}/${totalMethods} methods are pure passthrough — no business logic, validation, or transformation`,
          location: { file: filePath },
        }),
      );
    }
  }

  /**
   * Detect boilerplate similarity: when many methods in a single file share
   * near-identical body structure (same AST shape, different identifiers).
   */
  private checkBoilerplateSimilarity(
    content: string,
    filePath: string,
    issues: Issue[],
  ): void {
    const funcStart = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;

    const bodySignatures: string[] = [];
    let m;
    while ((m = funcStart.exec(content)) !== null) {
      const name = m[1];
      if (LogicCompletenessEvaluator.CONTROL_KEYWORDS.has(name)) continue;
      if (LogicCompletenessEvaluator.LIFECYCLE_METHODS.has(name)) continue;

      const bodyStart = m.index + m[0].length;
      let depth = 1;
      let i = bodyStart;
      while (i < content.length && depth > 0) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) continue;

      const body = content.substring(bodyStart, i - 1).trim();
      if (body.length === 0) continue;

      // Normalize: replace identifiers/strings with placeholders to compare structure
      const signature = body
        .replace(/\b(this\.)\w+/g, "$1_ID_")
        .replace(/['"`][^'"`]*['"`]/g, '"_STR_"')
        .replace(/\b\d+\b/g, "_NUM_")
        .replace(/\s+/g, " ")
        .trim();
      bodySignatures.push(signature);
    }

    if (bodySignatures.length < 4) return;

    // Count occurrences of each signature
    const sigCounts = new Map<string, number>();
    for (const sig of bodySignatures) {
      sigCounts.set(sig, (sigCounts.get(sig) || 0) + 1);
    }

    // Find the most repeated signature
    let maxCount = 0;
    for (const count of sigCounts.values()) {
      if (count > maxCount) maxCount = count;
    }

    const duplicateRatio = maxCount / bodySignatures.length;
    // Flag when >60% of methods share identical structure (minimum 4 identical)
    if (maxCount >= 4 && duplicateRatio > 0.6) {
      issues.push(
        createIssue({
          severity: "warning",
          category: "completeness",
          code: "LOGIC018",
          message: `${maxCount}/${bodySignatures.length} methods have identical structure — likely copy-paste boilerplate without domain-specific logic`,
          location: { file: filePath },
        }),
      );
    }
  }

  /**
   * Detect providers whose methods are all thin Prisma wrappers. e.g. every
   * method body is just `return
   * this.prisma.xxx.findMany/create/update/delete(...)`
   */
  private checkPrismaOnlyProvider(
    content: string,
    filePath: string,
    issues: Issue[],
  ): void {
    // Only check provider/service files
    if (!/provider|service/i.test(filePath)) return;

    const funcStart = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
    // Prisma CRUD pattern: body is only `return (await)? this.prisma.xxx.method(...);`
    const prismaOnly =
      /^\s*return\s+(?:await\s+)?this\.\w*(?:prisma|repository)\w*\.\w+\.\w+\s*\(/;

    let m;
    let prismaCount = 0;
    let totalMethods = 0;
    while ((m = funcStart.exec(content)) !== null) {
      const name = m[1];
      if (LogicCompletenessEvaluator.CONTROL_KEYWORDS.has(name)) continue;
      if (LogicCompletenessEvaluator.LIFECYCLE_METHODS.has(name)) continue;
      if (name === "constructor") continue;

      const bodyStart = m.index + m[0].length;
      let depth = 1;
      let i = bodyStart;
      while (i < content.length && depth > 0) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) continue;

      const body = content.substring(bodyStart, i - 1).trim();
      if (body.length === 0) continue;
      totalMethods++;

      // Check if body is a single statement that just calls prisma
      const statements = body.split(";").filter((s) => s.trim().length > 0);
      if (statements.length <= 1 && prismaOnly.test(body)) {
        prismaCount++;
      }
    }

    // Flag when >80% of methods are prisma-only (minimum 3 methods)
    if (totalMethods >= 3 && prismaCount / totalMethods > 0.8) {
      issues.push(
        createIssue({
          severity: "warning",
          category: "completeness",
          code: "LOGIC019",
          message: `${prismaCount}/${totalMethods} provider methods are thin Prisma wrappers — no validation, transformation, or business rules`,
          location: { file: filePath },
        }),
      );
    }
  }
}
