import * as p from "@clack/prompts";
import * as fs from "fs";
import * as path from "path";

import type { LLMProvider } from "../../agents";
import {
  formatCorrelationMarkdown,
  generateCorrelationReport,
} from "../../reporters";
import type { EvaluationResult } from "../../types";
import type { BatchCommandOptions } from "../types";
import { VALID_PROJECTS } from "../types";
import { runCLI } from "./evaluate";

interface BatchTarget {
  model: string;
  project: string;
  inputPath: string;
}

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

export async function runBatch(options: BatchCommandOptions): Promise<void> {
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
