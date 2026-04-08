import * as p from "@clack/prompts";
import * as fs from "fs";
import * as path from "path";

import type { LLMProvider } from "../../agents/types";
import { DIAGNOSE_MODEL, runDiagnosis } from "../../core/diagnose";
import { EvaluationPipeline } from "../../core/pipeline";
import type { EvaluationInput, EvaluationResult } from "../../types";

export interface DiagnoseCLIOptions {
  input?: string;
  report?: string;
  output: string;
  apiKey?: string;
  provider: string;
  model?: string;
  verbose?: boolean;
  continueOnGateFailure?: boolean;
}

export async function runDiagnose(options: DiagnoseCLIOptions): Promise<void> {
  if (!options.apiKey) {
    options.apiKey = process.env.OPENROUTER_API_KEY;
  }

  if (!options.apiKey) {
    p.log.error("--api-key is required (or set OPENROUTER_API_KEY)");
    process.exit(1);
  }

  if (!options.input && !options.report) {
    p.log.error(
      "Either --input (project path) or --report (existing JSON report) is required",
    );
    process.exit(1);
  }

  const outputDir = path.resolve(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  p.intro("🔬 AutoBE Compile Error Diagnosis");

  let result: EvaluationResult;
  let targetPath: string;

  if (options.report) {
    // Use existing evaluation result
    const reportPath = path.resolve(options.report);
    if (!fs.existsSync(reportPath)) {
      p.log.error(`Report file not found: ${reportPath}`);
      process.exit(1);
    }

    p.log.info(`Loading report: ${reportPath}`);
    const reportData = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    result = reportData as EvaluationResult;
    targetPath = result.targetPath;

    if (!fs.existsSync(targetPath)) {
      p.log.warn(`Original project path not found: ${targetPath}`);
      p.log.info("Source code context will be limited");
    }
  } else {
    // Run evaluation first
    const inputPath = path.resolve(options.input!);
    if (!fs.existsSync(inputPath)) {
      p.log.error(`Input path not found: ${inputPath}`);
      process.exit(1);
    }

    targetPath = inputPath;
    p.log.info(`Input: ${inputPath}`);

    const spinner = p.spinner();
    spinner.start("Running evaluation...");

    const input: EvaluationInput = {
      inputPath,
      outputPath: outputDir,
      options: {
        continueOnGateFailure: options.continueOnGateFailure ?? true,
      },
    };

    const pipeline = new EvaluationPipeline(options.verbose);
    result = await pipeline.evaluate(input);

    spinner.stop(
      `Evaluation complete: ${result.totalScore}/100 (${result.grade})`,
    );
  }

  // Check if there are errors to diagnose
  const gateIssues = result.phases.gate.issues.filter(
    (i) => i.severity === "critical" || i.severity === "warning",
  );

  if (gateIssues.length === 0) {
    p.log.success("No compile errors to diagnose!");
    p.outro("Project passes gate validation cleanly.");
    return;
  }

  p.log.info(`Found ${gateIssues.length} compile issues to diagnose`);

  // Run diagnosis
  const model = options.model || DIAGNOSE_MODEL;
  const spinner = p.spinner();
  spinner.start(`Running LLM diagnosis (${model})...`);

  const diagResult = await runDiagnosis(result, targetPath, {
    provider: options.provider as LLMProvider,
    apiKey: options.apiKey,
    model,
    verbose: options.verbose,
  });

  spinner.stop("Diagnosis complete");

  // Write output
  const outputFile = path.join(outputDir, "diagnosis.md");
  fs.writeFileSync(outputFile, diagResult.markdown);

  // Cost summary
  const cost =
    (diagResult.tokensUsed.inputCost ?? 0) +
    (diagResult.tokensUsed.outputCost ?? 0);

  p.log.success(`Diagnosis written to: ${outputFile}`);
  p.log.info(`  Files analyzed: ${diagResult.filesAnalyzed}`);
  p.log.info(`  Total errors: ${diagResult.totalErrors}`);
  p.log.info(
    `  Tokens: ${diagResult.tokensUsed.input} in / ${diagResult.tokensUsed.output} out`,
  );
  if (cost > 0) {
    p.log.info(`  Cost: $${cost.toFixed(4)}`);
  }
  p.log.info(`  Duration: ${(diagResult.durationMs / 1000).toFixed(1)}s`);

  p.outro(`Diagnosis saved to ${outputFile}`);
}
