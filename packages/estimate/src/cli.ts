import * as p from "@clack/prompts";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

import {
  AgentConfig,
  AgentResult,
  HALLUCINATION_MODEL,
  HallucinationAgent,
  LLMProvider,
  LLMQualityAgent,
  QUALITY_MODEL,
  SECURITY_MODEL,
  SecurityAgent,
} from "./agents";
import { EvaluationPipeline } from "./core/pipeline";
import {
  formatCorrelationMarkdown,
  generateCorrelationReport,
  generateJsonReport,
  generateMarkdownReport,
} from "./reporters";
import { flushLangfuse, getActiveTrace, recordAgentResults } from "./telemetry";
import type {
  EvaluationContext,
  EvaluationInput,
  EvaluationResult,
  PhaseResult,
} from "./types";
import {
  AGENT_WEIGHTS,
  AGENT_WEIGHT_RATIO,
  PHASE_NAMES,
  scoreToGrade,
} from "./types";

export interface CLIOptions {
  input: string;
  output: string;
  verbose?: boolean;
  continueOnGateFailure?: boolean;
  useAgent?: boolean;
  provider?: LLMProvider;
  apiKey?: string;
  autoFix?: boolean;
  runTests?: boolean;
  golden?: boolean;
  project?: string;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("estimate")
    .description("Evaluate AutoBE generated code quality")
    .version("1.0.0")
    .requiredOption("-i, --input <path>", "Input project path")
    .requiredOption("-o, --output <path>", "Output directory for reports")
    .option("-v, --verbose", "Enable verbose output (default: false)", false)
    .option(
      "--continue-on-gate-failure",
      "Continue evaluation even if gate fails (default: false)",
      false,
    )
    .option("--use-agent", "Enable AI agent evaluation (default: false)", false)
    .option(
      "--provider <provider>",
      "LLM provider (default: openrouter)",
      "openrouter",
    )
    .option("--api-key <key>", "API key for LLM provider")
    .option("--auto-fix", "Auto-fix simple issues after evaluation", false)
    .option("--run-tests", "Start Docker server and run e2e tests", false)
    .option("--golden", "Run Golden Set evaluation", false)
    .option(
      "--project <project>",
      "Project type for Golden Set (todo|bbs|reddit|shopping|erp|gauzy)",
    )
    .action(async (options) => {
      await runCLI(options);
    });

  program
    .command("batch")
    .description(
      "Run estimate for all models/projects found in autobe-examples directory",
    )
    .requiredOption(
      "-e, --examples <path>",
      "Path to autobe-examples directory",
    )
    .option(
      "-o, --output <path>",
      "Output base directory for reports",
      "reports/benchmark",
    )
    .option("--use-agent", "Enable AI agent evaluation", false)
    .option("--provider <provider>", "LLM provider", "openrouter")
    .option("--api-key <key>", "API key for LLM provider")
    .option(
      "--continue-on-gate-failure",
      "Continue evaluation even if gate fails",
      false,
    )
    .option("-v, --verbose", "Enable verbose output", false)
    .option("--model <name>", "Run only a specific model (e.g., kimi-k2.5)")
    .option("--project <name>", "Run only a specific project (e.g., reddit)")
    .action(async (options) => {
      await runBatch(options);
    });

  program
    .command("compare")
    .description("Compare multiple model results side by side")
    .requiredOption(
      "-p, --projects <paths...>",
      "Paths to project results (format: name:path)",
    )
    .requiredOption(
      "-o, --output <path>",
      "Output directory for comparison report",
    )
    .option("-v, --verbose", "Enable verbose output", false)
    .option("--use-agent", "Enable AI agent evaluation", false)
    .option("--provider <provider>", "LLM provider", "openrouter")
    .option("--api-key <key>", "API key for LLM provider")
    .action(async (options) => {
      await runCompare(options);
    });

  return program;
}

/** Score breakdown with phase and agent contributions */
interface ScoreBreakdown {
  phaseScore: number;
  phaseWeight: number;
  phaseContribution: number;
  agentScore: number | null;
  agentWeight: number;
  agentContribution: number;
}

export async function runCLI(options: CLIOptions): Promise<void> {
  if (!options.apiKey) {
    options.apiKey = process.env.OPENROUTER_API_KEY;
  }

  if (!options.input) {
    p.log.error("--input is required");
    process.exit(1);
  }

  if (!options.output) {
    p.log.error("--output is required");
    process.exit(1);
  }

  if (options.useAgent && !options.apiKey) {
    p.log.error("--api-key is required when using --use-agent");
    p.log.info("Or set OPENROUTER_API_KEY environment variable");
    process.exit(1);
  }

  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);

  if (!fs.existsSync(inputPath)) {
    p.log.error(`Input path does not exist: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  p.intro("🔍 AutoBE Code Evaluation");

  p.log.info(`Input: ${inputPath}`);
  p.log.info(`Output: ${outputPath}`);
  if (options.useAgent) {
    p.log.info(`Agent: ${options.provider} (AI evaluation enabled)`);
  }

  const spinner = p.spinner();
  spinner.start("Building evaluation context...");

  const input: EvaluationInput = {
    inputPath,
    outputPath,
    options: {
      continueOnGateFailure: options.continueOnGateFailure,
      runTests: options.runTests,
      golden: options.golden,
      project: options.project,
    },
  };

  const pipeline = new EvaluationPipeline(options.verbose);
  const result = await pipeline.evaluate(input);

  spinner.stop("Evaluation complete");

  // Auto-fix
  const allFixableIssues = [...result.criticalIssues, ...result.warnings];
  if (options.autoFix && allFixableIssues.length > 0) {
    const { AutoFixer } = await import("./fixers");
    const fixer = new AutoFixer(options.verbose);

    const fixable = allFixableIssues.filter((i) =>
      ["TS1161", "TS7006"].includes(i.code),
    );

    if (fixable.length > 0) {
      p.log.info(`Found ${fixable.length} auto-fixable issue(s):`);
      for (const issue of fixable.slice(0, 5)) {
        const loc = issue.location
          ? `${path.basename(issue.location.file)}:${issue.location.line}`
          : "unknown";
        p.log.message(`  • [${issue.code}] ${issue.message} (${loc})`);
      }
      if (fixable.length > 5) {
        p.log.message(`  ... and ${fixable.length - 5} more`);
      }

      const confirm = await p.confirm({
        message: `Apply ${fixable.length} auto-fix(es) and re-evaluate?`,
      });

      if (p.isCancel(confirm) || !confirm) {
        p.log.info("Skipped auto-fix.");
      } else {
        const fixedPath = path.join(outputPath, "fixed");
        if (!fs.existsSync(fixedPath)) {
          fs.cpSync(inputPath, fixedPath, { recursive: true });
        }

        for (const issue of allFixableIssues) {
          if (issue.location?.file) {
            issue.location.file = issue.location.file.replace(
              inputPath,
              fixedPath,
            );
          }
        }

        p.log.info("Running auto-fix on copy...");
        const fixResults = await fixer.fix(allFixableIssues);
        const fixed = fixResults.filter((r) => r.fixed).length;

        if (fixed > 0) {
          p.log.success(`Auto-fixed ${fixed} issues in ${fixedPath}`);
          p.log.info("Re-running evaluation on fixed copy...");
          const fixedInput: EvaluationInput = {
            ...input,
            inputPath: fixedPath,
          };
          const reResult = await pipeline.evaluate(fixedInput);
          Object.assign(result, reResult);
        } else {
          p.log.info("No issues were actually fixed.");
        }

        p.log.info(`Original files untouched: ${inputPath}`);
      }
    } else {
      p.log.info("No auto-fixable issues found.");
    }
  }

  // Agent evaluations
  let agentResults: AgentResult[] = [];
  if (options.useAgent && options.apiKey) {
    const agentSpinner = p.spinner();
    agentSpinner.start("Running AI Agent Evaluations...");

    agentResults = await runAgentEvaluations(
      pipeline.getContext()!,
      {
        provider: options.provider as LLMProvider,
        apiKey: options.apiKey,
      },
      options.verbose,
    );

    agentSpinner.stop("AI Agent Evaluations complete");

    // Record agent results to Langfuse trace
    const trace = getActiveTrace();
    if (trace && agentResults.length > 0) {
      const successForTrace = agentResults.filter(
        (r) => r.agent in AGENT_WEIGHTS && r.score >= 0,
      );
      let agentAvgForTrace = 0;
      if (successForTrace.length > 0) {
        const wSum = successForTrace.reduce(
          (sum, r) => sum + AGENT_WEIGHTS[r.agent],
          0,
        );
        agentAvgForTrace = successForTrace.reduce(
          (sum, r) => sum + r.score * (AGENT_WEIGHTS[r.agent] / wSum),
          0,
        );
      }
      const phasesPortion = result.totalScore * (1 - AGENT_WEIGHT_RATIO);
      const agentPortion = agentAvgForTrace * AGENT_WEIGHT_RATIO;
      recordAgentResults(
        trace,
        agentResults,
        Math.round(phasesPortion + agentPortion),
      );
    }
  }

  // Reports
  const jsonPath = path.join(outputPath, "estimate-report.json");
  const mdPath = path.join(outputPath, "estimate-report.md");

  let adjustedScore = result.totalScore;
  let agentAvg = 0;
  if (agentResults.length > 0 && result.phases.gate.passed) {
    // Exclude failed agents (score < 0) and re-normalize weights
    const successAgents = agentResults.filter(
      (r) => r.agent in AGENT_WEIGHTS && r.score >= 0,
    );
    if (successAgents.length > 0) {
      const weightSum = successAgents.reduce(
        (sum, r) => sum + AGENT_WEIGHTS[r.agent],
        0,
      );
      agentAvg = successAgents.reduce(
        (sum, r) => sum + r.score * (AGENT_WEIGHTS[r.agent] / weightSum),
        0,
      );

      const phasesPortion = result.totalScore * (1 - AGENT_WEIGHT_RATIO);
      const agentPortion = agentAvg * AGENT_WEIGHT_RATIO;
      adjustedScore = Math.round(phasesPortion + agentPortion);

      // Two-tier agent cap (only when ALL agents succeeded — API failures excluded)
      const allWeightedAgents = agentResults.filter(
        (r) => r.agent in AGENT_WEIGHTS,
      );
      const failedAgents = allWeightedAgents.filter((r) => r.score < 0);
      if (failedAgents.length === 0) {
        if (agentAvg < 25) adjustedScore = Math.min(adjustedScore, 40);
        else if (agentAvg < 40) adjustedScore = Math.min(adjustedScore, 55);
      } else {
        console.log(
          `  ⚠ ${failedAgents.length} agent(s) failed (API error) — two-tier cap skipped`,
        );
      }
    }
    // If all agents failed, adjustedScore stays as phase-only score
  }

  const scoreBreakdown: ScoreBreakdown = {
    phaseScore: result.totalScore,
    phaseWeight: agentResults.length > 0 ? 1 - AGENT_WEIGHT_RATIO : 1.0,
    phaseContribution:
      agentResults.length > 0
        ? Math.round(result.totalScore * (1 - AGENT_WEIGHT_RATIO))
        : result.totalScore,
    agentScore: agentResults.length > 0 ? Math.round(agentAvg) : null,
    agentWeight: agentResults.length > 0 ? AGENT_WEIGHT_RATIO : 0,
    agentContribution:
      agentResults.length > 0 ? Math.round(agentAvg * AGENT_WEIGHT_RATIO) : 0,
  };

  const fullResult = {
    ...result,
    totalScore: adjustedScore,
    grade: scoreToGrade(adjustedScore),
    agentEvaluations: agentResults,
    scoreBreakdown,
  };

  fs.writeFileSync(jsonPath, generateJsonReport(fullResult));
  fs.writeFileSync(mdPath, generateMarkdownReport(fullResult));

  printResults(fullResult);

  if (agentResults.length > 0) {
    printAgentResults(agentResults);
  }

  printFinalScore(
    fullResult,
    result.totalScore,
    agentAvg,
    agentResults.length > 0,
  );

  p.log.success("Reports generated:");
  p.log.info(`  • ${mdPath}`);
  p.log.info(`  • ${jsonPath}`);

  // Flush Langfuse telemetry before exit
  await flushLangfuse();

  p.outro(
    `Final Score: ${fullResult.totalScore}/100 (Grade: ${fullResult.grade})`,
  );
}

/** Options for the compare subcommand */
interface CompareCommandOptions {
  projects: string[];
  output: string;
  verbose?: boolean;
  useAgent?: boolean;
  provider?: string;
  apiKey?: string;
}

interface BatchCommandOptions {
  examples: string;
  output: string;
  useAgent?: boolean;
  provider?: string;
  apiKey?: string;
  continueOnGateFailure?: boolean;
  verbose?: boolean;
  model?: string;
  project?: string;
}

interface BatchTarget {
  model: string;
  project: string;
  inputPath: string;
}

const VALID_PROJECTS = new Set([
  "todo",
  "bbs",
  "reddit",
  "shopping",
  "erp",
  "gauzy",
]);

function discoverTargets(examplesDir: string): BatchTarget[] {
  const targets: BatchTarget[] = [];
  const vendors = fs.readdirSync(examplesDir).filter((d) => {
    const full = path.join(examplesDir, d);
    return (
      fs.statSync(full).isDirectory() &&
      d !== ".git" &&
      d !== "raw" &&
      d !== "node_modules"
    );
  });

  for (const vendor of vendors) {
    const vendorPath = path.join(examplesDir, vendor);
    const models = fs
      .readdirSync(vendorPath)
      .filter((d) => fs.statSync(path.join(vendorPath, d)).isDirectory());

    for (const model of models) {
      const modelPath = path.join(vendorPath, model);
      const projects = fs.readdirSync(modelPath).filter((d) => {
        const full = path.join(modelPath, d);
        return fs.statSync(full).isDirectory() && VALID_PROJECTS.has(d);
      });

      for (const project of projects) {
        targets.push({
          model,
          project,
          inputPath: path.join(modelPath, project),
        });
      }
    }
  }

  return targets.sort((a, b) =>
    `${a.model}/${a.project}`.localeCompare(`${b.model}/${b.project}`),
  );
}

async function runBatch(options: BatchCommandOptions): Promise<void> {
  if (!options.apiKey) {
    options.apiKey = process.env.OPENROUTER_API_KEY;
  }

  const examplesDir = path.resolve(options.examples);
  if (!fs.existsSync(examplesDir)) {
    p.log.error(`Examples directory not found: ${examplesDir}`);
    process.exit(1);
  }

  let targets = discoverTargets(examplesDir);

  if (options.model) {
    targets = targets.filter((t) => t.model === options.model);
  }
  if (options.project) {
    targets = targets.filter((t) => t.project === options.project);
  }

  if (targets.length === 0) {
    p.log.error(
      "No targets found. Check --examples path or --model/--project filters.",
    );
    process.exit(1);
  }

  p.intro(`AutoBE Batch Evaluation — ${targets.length} target(s)`);
  for (const t of targets) {
    p.log.info(`  • ${t.model}/${t.project}`);
  }

  const results: Array<{
    model: string;
    project: string;
    score: number;
    grade: string;
  }> = [];
  let completed = 0;

  for (const target of targets) {
    completed++;
    const label = `${target.model}/${target.project}`;
    p.log.step(`[${completed}/${targets.length}] ${label}`);

    const outputPath = path.resolve(
      options.output,
      target.model,
      target.project,
    );

    try {
      await runCLI({
        input: target.inputPath,
        output: outputPath,
        verbose: options.verbose,
        continueOnGateFailure: options.continueOnGateFailure,
        useAgent: options.useAgent,
        provider: options.provider as LLMProvider | undefined,
        apiKey: options.apiKey,
        project: target.project,
      });

      // Read back the result
      const reportPath = path.join(outputPath, "estimate-report.json");
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
        results.push({
          model: target.model,
          project: target.project,
          score: report.totalScore,
          grade: report.grade,
        });
      }
    } catch (err) {
      p.log.error(
        `Failed: ${label} — ${err instanceof Error ? err.message : String(err)}`,
      );
      results.push({
        model: target.model,
        project: target.project,
        score: -1,
        grade: "ERR",
      });
    }
  }

  // Print summary table
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Batch Results Summary");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `  ${"Model".padEnd(30)} ${"Project".padEnd(12)} ${"Score".padEnd(8)} Grade`,
  );
  console.log("  " + "─".repeat(58));
  for (const r of results) {
    const scoreStr = r.score < 0 ? "ERROR" : `${r.score}/100`;
    console.log(
      `  ${r.model.padEnd(30)} ${r.project.padEnd(12)} ${scoreStr.padEnd(8)} ${r.grade}`,
    );
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Save summary JSON
  const summaryPath = path.resolve(options.output, "batch-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  p.log.success(`Summary saved: ${summaryPath}`);

  // Cross-phase correlation analysis
  const fullResults: EvaluationResult[] = [];
  for (const target of targets) {
    const reportPath = path.join(
      path.resolve(options.output, target.model, target.project),
      "estimate-report.json",
    );
    try {
      if (fs.existsSync(reportPath)) {
        fullResults.push(JSON.parse(fs.readFileSync(reportPath, "utf-8")));
      }
    } catch {
      // skip unreadable reports
    }
  }

  if (fullResults.length >= 3) {
    const correlationReport = generateCorrelationReport(fullResults);
    const correlationMd = formatCorrelationMarkdown(correlationReport);
    const correlationPath = path.resolve(
      options.output,
      "correlation-report.md",
    );
    const correlationJsonPath = path.resolve(
      options.output,
      "correlation-report.json",
    );
    fs.writeFileSync(correlationPath, correlationMd);
    fs.writeFileSync(
      correlationJsonPath,
      JSON.stringify(correlationReport, null, 2),
    );
    p.log.success(`Correlation report: ${correlationPath}`);

    // Print key insights
    if (correlationReport.insights.length > 0) {
      console.log("\n📊 Cross-Phase Insights:");
      for (const insight of correlationReport.insights.slice(0, 5)) {
        console.log(`  • ${insight.description}`);
      }
      console.log("");
    }
  }

  p.outro(`Done — ${results.length} evaluations completed`);
}

async function runCompare(options: CompareCommandOptions): Promise<void> {
  const { CompareEvaluator, CompareReporter } = await import("./compare");

  if (!options.apiKey) {
    options.apiKey = process.env.OPENROUTER_API_KEY;
  }

  const projects = options.projects.map((proj) => {
    const sep = proj.indexOf(":");
    if (sep === -1) {
      return {
        name: path.basename(path.dirname(proj)),
        path: path.resolve(proj),
      };
    }
    return {
      name: proj.slice(0, sep),
      path: path.resolve(proj.slice(sep + 1)),
    };
  });

  p.intro("📊 AutoBE Model Comparison");
  p.log.info(`Comparing ${projects.length} projects`);
  for (const proj of projects) {
    p.log.info(`  • ${proj.name}: ${proj.path}`);
  }

  const evaluator = new CompareEvaluator(options.verbose);
  const result = await evaluator.compare({
    projects,
    outputPath: path.resolve(options.output),
    useAgent: options.useAgent,
    provider: options.provider,
    apiKey: options.apiKey,
    verbose: options.verbose,
  });

  const reporter = new CompareReporter();
  reporter.printToTerminal(result);
  const { mdPath, jsonPath } = reporter.saveReports(
    result,
    path.resolve(options.output),
  );

  p.log.success("Reports saved:");
  p.log.info(`  • ${mdPath}`);
  p.log.info(`  • ${jsonPath}`);
  p.outro("Done!");
}

async function runAgentEvaluations(
  context: EvaluationContext,
  baseConfig: Omit<AgentConfig, "model">,
  _verbose?: boolean,
): Promise<AgentResult[]> {
  const securityAgent = new SecurityAgent({
    ...baseConfig,
    model: SECURITY_MODEL,
  });
  const llmQualityAgent = new LLMQualityAgent({
    ...baseConfig,
    model: QUALITY_MODEL,
  });
  const hallucinationAgent = new HallucinationAgent({
    ...baseConfig,
    model: HALLUCINATION_MODEL,
  });

  const [securityResult, llmQualityResult, hallucinationResult] =
    await Promise.all([
      securityAgent.evaluate(context),
      llmQualityAgent.evaluate(context),
      hallucinationAgent.evaluate(context),
    ]);

  return [securityResult, llmQualityResult, hallucinationResult];
}

function printAgentResults(agentResults: AgentResult[]): void {
  console.log(
    `\n🤖 AI Agent Evaluations (${Math.round(AGENT_WEIGHT_RATIO * 100)}% of total score):`,
  );
  console.log("─────────────────────────────────────────");

  for (const result of agentResults) {
    const scoreEmoji =
      result.score >= 80 ? "✅" : result.score >= 60 ? "⚠️" : "❌";
    const criticalCount = result.issues.filter(
      (i) => i.severity === "critical",
    ).length;
    const warningCount = result.issues.filter(
      (i) => i.severity === "warning",
    ).length;
    const refTag = result.agent in AGENT_WEIGHTS ? "" : " [ref]";
    console.log(
      `   ${result.agent}: ${result.score}/100 ${scoreEmoji}${refTag}`,
    );
    console.log(
      `      Issues: ${result.issues.length} (${criticalCount} critical, ${warningCount} warning)`,
    );
    if (result.tokensUsed) {
      const t = result.tokensUsed;
      const totalCost = (t.inputCost || 0) + (t.outputCost || 0);
      console.log(
        `      Tokens: ${t.input.toLocaleString()} in / ${t.output.toLocaleString()} out` +
          (totalCost > 0 ? ` ($${totalCost.toFixed(4)})` : ""),
      );
    }
    if (result.deepEvalScores) {
      const d = result.deepEvalScores;
      console.log(
        `      DeepEval: Faith=${d.faithfulness} Rel=${d.relevancy} Prec=${d.contextualPrecision}`,
      );
    }
    const summaryText =
      result.summary.length > 120
        ? result.summary.substring(0, 120) + "..."
        : result.summary;
    console.log(`      Summary: ${summaryText}`);
    console.log("");
  }

  const totalAgentCost = agentResults.reduce((sum, r) => {
    const c = r.tokensUsed;
    return sum + (c?.inputCost || 0) + (c?.outputCost || 0);
  }, 0);
  if (totalAgentCost > 0) {
    console.log(`   Total Agent Cost: $${totalAgentCost.toFixed(4)}`);
  }
  console.log("─────────────────────────────────────────");
}

function printFinalScore(
  result: EvaluationResult & { totalScore: number; grade: string },
  phaseScore: number,
  agentAvg: number,
  hasAgents: boolean,
): void {
  const gradeEmoji: Record<string, string> = {
    A: "🏆",
    B: "👍",
    C: "📊",
    D: "⚠️",
    F: "❌",
  };

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `\n${gradeEmoji[result.grade] || "📊"} Final Score: ${result.totalScore}/100 (Grade: ${result.grade})\n`,
  );

  if (!result.phases.gate.passed) {
    console.log(`   ❌ Gate Failed — Score forced to 0`);
    if (hasAgents && agentAvg > 0) {
      const phaseW = 1 - AGENT_WEIGHT_RATIO;
      const wouldBe = Math.round(
        phaseScore * phaseW + agentAvg * AGENT_WEIGHT_RATIO,
      );
      console.log(
        `   (Reference: Phase ${phaseScore}, Agent ${Math.round(agentAvg)} → ~${wouldBe}/100 if gate passed)`,
      );
    }
  } else if (hasAgents) {
    const phaseW = 1 - AGENT_WEIGHT_RATIO;
    const rawTotal = Math.round(
      phaseScore * phaseW + agentAvg * AGENT_WEIGHT_RATIO,
    );
    console.log(
      `   Phase Score:  ${phaseScore}/100 × ${Math.round(phaseW * 100)}% = ${(phaseScore * phaseW).toFixed(1)}`,
    );
    console.log(
      `   Agent Score:  ${Math.round(agentAvg)}/100 × ${Math.round(AGENT_WEIGHT_RATIO * 100)}% = ${(agentAvg * AGENT_WEIGHT_RATIO).toFixed(1)}`,
    );
    if (result.totalScore < rawTotal) {
      console.log(`   ─────────────────────────────`);
      console.log(`   Subtotal:     ${rawTotal}/100`);
      console.log(
        `   ⚠️  Agent Critical Cap: → ${result.totalScore}/100 (${rawTotal - result.totalScore} point cap applied)`,
      );
    }
    console.log(`   ─────────────────────────────`);
    console.log(`   Total:        ${result.totalScore}/100`);
  } else {
    console.log(`   Phase Score:  ${phaseScore}/100`);
    console.log(
      `\n   ⚠️  AI Agent evaluation disabled. Score may be inflated.`,
    );
    console.log(`   Run with --use-agent for more accurate results.`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

function printResults(result: EvaluationResult): void {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(
    `📋 Scoring Phases (${Math.round((1 - AGENT_WEIGHT_RATIO) * 100)}% of total score):`,
  );
  console.log("─────────────────────────────────────────");

  const gateStatus = result.phases.gate.passed ? "✅ Pass" : "❌ Fail";
  console.log(`   Gate:                    ${gateStatus}`);
  if (!result.phases.gate.passed && result.phases.gate.metrics?.reason) {
    const reason = String(result.phases.gate.metrics.reason);
    console.log(`   Reason:                  ${reason}`);
  }

  printPhaseScore("documentQuality", result.phases.documentQuality);
  printPhaseScore("requirementsCoverage", result.phases.requirementsCoverage);
  printPhaseScore("testCoverage", result.phases.testCoverage);
  printPhaseScore("logicCompleteness", result.phases.logicCompleteness);
  printPhaseScore("apiCompleteness", result.phases.apiCompleteness);

  if (result.phases.goldenSet) {
    const gs = result.phases.goldenSet;
    const passed = (gs.metrics?.passedFeatures as number) ?? 0;
    const total = (gs.metrics?.totalFeatures as number) ?? 0;
    console.log(
      `   ${"Golden Set".padEnd(24)} ${gs.score}/100 (${passed}/${total} passed)`,
    );
  }

  console.log("─────────────────────────────────────────\n");

  console.log("📋 Reference Info (no score impact):");
  console.log("─────────────────────────────────────────");
  console.log(
    `   Complexity:    ${result.reference.complexity.complexFunctions} complex functions (max: ${result.reference.complexity.maxComplexity})`,
  );
  console.log(
    `   Duplication:   ${result.reference.duplication.totalBlocks} duplicate blocks`,
  );
  console.log(
    `   Naming:        ${result.reference.naming.totalIssues} issues`,
  );
  console.log(
    `   JSDoc:         ${result.reference.jsdoc.totalMissing} missing`,
  );
  console.log(
    `   Schema Sync:   ${result.reference.schemaSync.emptyTypes}/${result.reference.schemaSync.totalTypes} empty types, ${result.reference.schemaSync.mismatchedProperties} mismatched`,
  );
  console.log("─────────────────────────────────────────\n");

  if (result.performanceMetrics) {
    const pm = result.performanceMetrics;
    console.log("📏 Performance Metrics:");
    console.log("─────────────────────────────────────────");
    console.log(
      `   Code Size:     ${pm.totalSizeKB} KB (${pm.totalLines} lines)`,
    );
    console.log(
      `   Files:         ${pm.totalFiles} (avg ${pm.avgLinesPerFile} lines/file)`,
    );
    console.log(
      `   Largest:       ${pm.largestFile} (${pm.largestFileSizeKB} KB)`,
    );
    console.log(
      `   Breakdown:     ${pm.controllers} ctrl, ${pm.providers} prov, ${pm.structures} struct, ${pm.tests} test`,
    );
    console.log("─────────────────────────────────────────\n");
  }

  if (result.summary.criticalCount > 0) {
    console.log(`❌ Critical Issues: ${result.summary.criticalCount}`);
    console.log("   These must be fixed before production use.\n");
    printGroupedIssues(result.criticalIssues);
  }

  if (result.summary.warningCount > 0) {
    console.log(`⚠️  Warnings: ${result.summary.warningCount}`);
    console.log("   Top issues:\n");
    printGroupedIssues(result.warnings);
  }

  if (result.summary.suggestionCount > 0) {
    console.log(`💡 Suggestions: ${result.summary.suggestionCount}`);
    console.log("   Top issues:\n");
    printGroupedIssues(result.suggestions);
  }
}

/** Grouped issue entry for display */
interface GroupedIssue {
  message: string;
  count: number;
  files: string[];
}

function printGroupedIssues(issues: EvaluationResult["criticalIssues"]): void {
  const grouped = new Map<string, GroupedIssue>();

  for (const issue of issues) {
    const existing = grouped.get(issue.code);
    const file = issue.location
      ? path.basename(issue.location.file)
      : "unknown";

    if (existing) {
      existing.count++;
      if (!existing.files.includes(file) && existing.files.length < 3) {
        existing.files.push(file);
      }
    } else {
      grouped.set(issue.code, {
        message: issue.message,
        count: 1,
        files: [file],
      });
    }
  }

  const sorted = [...grouped.entries()].sort((a, b) => b[1].count - a[1].count);

  for (const [code, info] of sorted.slice(0, 5)) {
    const fileHint = info.files.join(", ");
    const more = info.count > info.files.length ? " ..." : "";
    const msg =
      info.message.length > 100
        ? info.message.substring(0, 100) + "..."
        : info.message;
    console.log(`   • [${code}] ×${info.count} — ${msg}`);
    console.log(`     files: ${fileHint}${more}`);
  }

  if (sorted.length > 5) {
    console.log(`   ... and ${sorted.length - 5} more issue types\n`);
  } else {
    console.log("");
  }
}

function printPhaseScore(phase: string, phaseResult: PhaseResult): void {
  const phaseName = PHASE_NAMES[phase as keyof typeof PHASE_NAMES] || phase;
  const score = phaseResult.score;
  const padded = phaseName.padEnd(24);

  let indicator = "";
  if (phaseResult.metrics?.skipped) {
    indicator = "⏭️  Skipped";
  } else if (score >= 90) {
    indicator = `${score}/100 ✅`;
  } else if (score >= 70) {
    indicator = `${score}/100 📊`;
  } else if (score >= 50) {
    indicator = `${score}/100 ⚠️`;
  } else {
    indicator = `${score}/100 ❌`;
  }

  console.log(`   ${padded} ${indicator}`);
}
