import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import fs from "fs";
import { OpenAI } from "openai";
import path from "path";

import { AdversarialAgent } from "./adversarial-agent";
import { formatDuration, formatDurationSecondsFromMs } from "./time-utils";

async function runAdversarialBenchmarks() {
  console.log("🔥 Running Adversarial Benchmarks...\n");

  if (!process.env.CHATGPT_API_KEY) {
    console.error("❌ CHATGPT_API_KEY environment variable is required");
    process.exit(1);
  }

  const agent = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({
        apiKey: process.env.CHATGPT_API_KEY,
        baseURL: process.env.CHATGPT_BASE_URL,
        maxRetries: 20,
      }),
      model: "gpt-4.1",
      semaphore: 32,
    },
    compiler: new AutoBeCompiler(),
  });

  // Get runs per scenario from environment or default to 3
  const runsPerScenario = parseInt(
    process.env.BENCHMARK_RUNS_PER_SCENARIO || "10",
  );

  const adversarialAgent = new AdversarialAgent(
    process.env.CHATGPT_API_KEY,
    process.env.CHATGPT_BASE_URL,
    runsPerScenario,
  );

  try {
    const benchmarkSummary = await adversarialAgent.runAllBenchmarks(agent);

    // Generate and save report to both root and logs directory
    const report = adversarialAgent.generateReport(benchmarkSummary);
    const rootReportPath = path.join(__dirname, "../benchmark-report.md");
    fs.writeFileSync(rootReportPath, report);

    // Also save to logs directory for archival
    const logsReportPath = adversarialAgent.getReportPath();
    fs.writeFileSync(logsReportPath, report);

    // Get benchmark logs directory path
    const logsDir = adversarialAgent.getLogsDirectory();
    
    console.log(`
📊 Benchmark report saved to: ${rootReportPath}
📊 Archived report saved to: ${logsReportPath}
📁 Benchmark logs directory: ${logsDir}

${"=".repeat(60)}
FINAL BENCHMARK SUMMARY
${"=".repeat(60)}
`);

    console.log(`
Total Benchmark Duration: ${(benchmarkSummary.totalBenchmarkDuration / 1000).toFixed(1)}s (${(benchmarkSummary.totalBenchmarkDuration / 60000).toFixed(1)} minutes)
Total Scenarios: ${benchmarkSummary.totalScenarios}
Runs Per Scenario: ${runsPerScenario}
Total Runs: ${benchmarkSummary.totalRuns}
Overall Flow Success Rate: ${benchmarkSummary.overallSuccessRate.toFixed(1)}%
Overall Completeness Score: ${benchmarkSummary.overallCompleteness.toFixed(1)}%
`);

    console.log(`
Scenario Breakdown:
${benchmarkSummary.scenarios
  .map(
    (scenarioResult) => `  - ${scenarioResult.scenarioName}:
    Flow Success: ${scenarioResult.successRate.toFixed(1)}% (${scenarioResult.successfulRuns}/${scenarioResult.totalRuns})
    Completeness: ${scenarioResult.averageCompleteness.toFixed(1)}%
    Avg Run Duration: ${formatDuration(scenarioResult.averageDuration)}
    Total Scenario Time: ${formatDurationSecondsFromMs(scenarioResult.totalScenarioDuration)}`,
  )
  .join("\n")}
`);
  } catch (error) {
    console.error("❌ Benchmark failed:", error);
    process.exit(1);
  }
}

async function main() {
  const mode = process.argv[2] || "benchmark";

  switch (mode) {
    case "benchmark":
      await runAdversarialBenchmarks();
      break;
    case "help":
      console.log(`
Usage: npm start [mode]

Modes:
  benchmark   Run adversarial benchmarks (default)
  help        Show this help message

Examples:
  npm start
  npm start benchmark
      `);
      break;
    default:
      console.error(`Unknown mode: ${mode}. Use 'help' for usage information.`);
      process.exit(1);
  }
}

main().catch(console.error);
