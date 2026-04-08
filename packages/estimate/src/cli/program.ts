import { Command } from "commander";

import { runBatch } from "./commands/batch";
import { runCompare } from "./commands/compare";
import { runDiagnose } from "./commands/diagnose";
import { runCLI } from "./commands/evaluate";

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
    .option("--no-agent", "Disable AI agent evaluation (enabled by default)")
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
    .option("--no-agent", "Disable AI agent evaluation (enabled by default)")
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
    .command("diagnose")
    .description(
      "Diagnose compile errors using LLM-powered 7-step forensic analysis",
    )
    .option("-i, --input <path>", "Input project path (runs evaluation first)")
    .option(
      "--report <path>",
      "Existing estimate-report.json (skips evaluation)",
    )
    .requiredOption(
      "-o, --output <path>",
      "Output directory for diagnosis markdown",
    )
    .option("--api-key <key>", "API key for LLM provider")
    .option("--provider <provider>", "LLM provider", "openrouter")
    .option("--model <model>", "LLM model for diagnosis")
    .option("-v, --verbose", "Enable verbose output", false)
    .option(
      "--continue-on-gate-failure",
      "Continue evaluation even if gate fails",
      true,
    )
    .action(async (options) => {
      await runDiagnose(options);
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
    .option("--no-agent", "Disable AI agent evaluation (enabled by default)")
    .option("--provider <provider>", "LLM provider", "openrouter")
    .option("--api-key <key>", "API key for LLM provider")
    .action(async (options) => {
      await runCompare(options);
    });

  return program;
}
