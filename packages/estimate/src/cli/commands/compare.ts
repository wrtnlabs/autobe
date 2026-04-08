import * as p from "@clack/prompts";
import * as path from "path";

import type { CompareCommandOptions } from "../types";

export async function runCompare(
  options: CompareCommandOptions,
): Promise<void> {
  const { CompareEvaluator, CompareReporter } = await import("../../compare");

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
