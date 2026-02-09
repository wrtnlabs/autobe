import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleBenchmark, AutoBeExampleLogger } from "@autobe/benchmark";
import { AutoBeExampleStorage } from "@autobe/benchmark/src/example/AutoBeExampleStorage";
import { IAutoBeExampleBenchmarkState } from "@autobe/benchmark/src/structures/IAutoBeExampleBenchmarkState";
import { AutoBeCompiler } from "@autobe/compiler";
import {
  AutoBeEvent,
  AutoBeExampleProject,
  IAutoBeCompilerListener,
} from "@autobe/interface";
import fs from "fs";
import path from "path";
import { Singleton, sleep_for } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

// ============================================================================
// METRICS TRACKING
// ============================================================================
interface BenchmarkMetrics {
  toolCalling: {
    total: number;
    byType: Record<string, number>;
  };
  tokenUsage: {
    input: number;
    output: number;
    cached: number;
    total: number;
  };
  timing: {
    startTime: number;
    endTime: number | null;
    elapsedMs: number;
  };
  ragEnabled: boolean;
}

// Global metrics per vendor/project
const metricsMap = new Map<string, BenchmarkMetrics>();

const createMetrics = (ragEnabled: boolean): BenchmarkMetrics => ({
  toolCalling: { total: 0, byType: {} },
  tokenUsage: { input: 0, output: 0, cached: 0, total: 0 },
  timing: { startTime: Date.now(), endTime: null, elapsedMs: 0 },
  ragEnabled,
});

const getMetricsKey = (vendor: string, project: string) =>
  `${vendor}::${project}`;
const runId = new Date().toISOString().replace(/[:.]/g, "-");

const extractTokenUsage = (
  tokenUsage: any,
): { input: number; output: number; cached: number; total: number } | null => {
  if (!tokenUsage) return null;
  const component =
    "aggregate" in tokenUsage ? tokenUsage.aggregate : tokenUsage;
  if (!component || typeof component !== "object") return null;
  const inputTotal = component.input?.total;
  const cached = component.input?.cached ?? 0;
  const outputTotal = component.output?.total;
  const total = component.total;
  if (
    typeof inputTotal !== "number" ||
    typeof outputTotal !== "number" ||
    typeof total !== "number"
  )
    return null;
  return { input: inputTotal, output: outputTotal, cached, total };
};

const trackEvent = (metrics: BenchmarkMetrics, event: AutoBeEvent) => {
  // Track preliminary (tool calling) events
  if (event.type === "preliminary") {
    const prelimEvent = event as { function?: string };
    metrics.toolCalling.total++;
    const funcName = prelimEvent.function ?? "unknown";
    metrics.toolCalling.byType[funcName] =
      (metrics.toolCalling.byType[funcName] ?? 0) + 1;
  }

  // Track token usage from events that have it
  const eventWithTokens = event as { tokenUsage?: unknown };
  const usage = extractTokenUsage(eventWithTokens.tokenUsage);
  if (usage) {
    metrics.tokenUsage.input += usage.input;
    metrics.tokenUsage.output += usage.output;
    metrics.tokenUsage.cached += usage.cached;
    metrics.tokenUsage.total += usage.total;
  }
};

const finalizeMetrics = (metrics: BenchmarkMetrics) => {
  metrics.timing.endTime = Date.now();
  metrics.timing.elapsedMs = metrics.timing.endTime - metrics.timing.startTime;
};

// ============================================================================
// RESULT PRINTING
// ============================================================================

const getAnalyzeOutputPaths = (vendor: string, project: string) => {
  const resultsPath = path.resolve(
    `${TestGlobal.ROOT}/results/${AutoBeExampleStorage.slugModel(vendor, false)}/${project}/analyze`,
  );
  const rawDir = path.resolve(
    AutoBeExampleStorage.getDirectory({ vendor, project }),
  );
  const analyzeHistory = path.resolve(`${rawDir}/analyze.histories.json.gz`);
  const analyzeSnapshots = path.resolve(`${rawDir}/analyze.snapshots.json.gz`);
  return { resultsPath, rawDir, analyzeHistory, analyzeSnapshots };
};

const archiveAnalyzeOutputs = async (vendor: string, project: string) => {
  const outputs = getAnalyzeOutputPaths(vendor, project);
  const root = path.resolve(
    `${TestGlobal.ROOT}/benchmark-runs/${runId}/${AutoBeExampleStorage.slugModel(
      vendor,
      false,
    )}/${project}/analyze`,
  );
  const copies: Array<Promise<unknown>> = [];
  if (fs.existsSync(outputs.resultsPath)) {
    copies.push(fs.promises.mkdir(root, { recursive: true }).then(() => {}));
    copies.push(
      fs.promises.cp(outputs.resultsPath, `${root}/files`, {
        recursive: true,
      }) as Promise<void>,
    );
  }
  const rawRoot = `${root}/raw`;
  if (fs.existsSync(outputs.analyzeHistory)) {
    copies.push(fs.promises.mkdir(rawRoot, { recursive: true }).then(() => {}));
    copies.push(
      fs.promises.copyFile(
        outputs.analyzeHistory,
        `${rawRoot}/analyze.histories.json.gz`,
      ),
    );
  }
  if (fs.existsSync(outputs.analyzeSnapshots)) {
    copies.push(fs.promises.mkdir(rawRoot, { recursive: true }).then(() => {}));
    copies.push(
      fs.promises.copyFile(
        outputs.analyzeSnapshots,
        `${rawRoot}/analyze.snapshots.json.gz`,
      ),
    );
  }
  await Promise.all(copies);
};

const printMetricsSummary = () => {
  console.log("\n" + "=".repeat(80));
  console.log("BENCHMARK METRICS SUMMARY");
  console.log("=".repeat(80));

  for (const [key, metrics] of metricsMap.entries()) {
    const [vendor, project] = key.split("::");
    console.log(
      `\n[${vendor} / ${project}] RAG: ${metrics.ragEnabled ? "ON" : "OFF"}`,
    );
    console.log("-".repeat(60));

    console.log(
      `  Total Time: ${(metrics.timing.elapsedMs / 1000).toFixed(1)} sec`,
    );

    console.log(`\n  Tool Calling:`);
    console.log(`    Total: ${metrics.toolCalling.total}`);
    for (const [type, count] of Object.entries(metrics.toolCalling.byType)) {
      console.log(`    - ${type}: ${count}`);
    }

    console.log(`\n  Token Usage:`);
    console.log(`    Input:  ${metrics.tokenUsage.input.toLocaleString()}`);
    console.log(`    Output: ${metrics.tokenUsage.output.toLocaleString()}`);
    console.log(`    Cached: ${metrics.tokenUsage.cached.toLocaleString()}`);
    console.log(`    Total:  ${metrics.tokenUsage.total.toLocaleString()}`);

    const outputs = getAnalyzeOutputPaths(vendor, project);
    const hasAnalyze = fs.existsSync(outputs.analyzeHistory);
    if (hasAnalyze) {
      console.log(`\n  Outputs:`);
      if (fs.existsSync(outputs.resultsPath)) {
        console.log(`    Analyze files: ${outputs.resultsPath}`);
      }
      console.log(`    Analyze history: ${outputs.analyzeHistory}`);
    }
  }

  // Save metrics to file
  const metricsResult = Object.fromEntries(
    Array.from(metricsMap.entries()).map(([key, metrics]) => [key, metrics]),
  );
  fs.writeFileSync(
    `${TestGlobal.ROOT}/benchmark.metrics.json`,
    JSON.stringify(metricsResult, null, 2),
    "utf8",
  );
  console.log(`\nMetrics saved to: ${TestGlobal.ROOT}/benchmark.metrics.json`);
};

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

const parseRagEnabled = (): boolean => {
  const args = process.argv;
  if (args.includes("--rag-disabled") || args.includes("--rag-off")) {
    return false;
  }
  // Default: RAG enabled
  return true;
};

// ============================================================================
// MAIN
// ============================================================================

const printState = (state: IAutoBeExampleBenchmarkState): void => {
  const task = async () => {
    while (true) {
      await sleep_for(2_500);
      try {
        await fs.promises.writeFile(
          `${TestGlobal.ROOT}/benchmark.log.md`,
          AutoBeExampleLogger.markdown(state),
          "utf8",
        );
      } catch {}
      if (
        state.vendors.every((v) =>
          v.projects.every((p) => p.completed_at !== null),
        )
      )
        break;
    }
  };
  task().catch(() => {});
};

const main = async (): Promise<void> => {
  const ragEnabled = parseRagEnabled();
  console.log(`\n${"=".repeat(80)}`);
  console.log(`BENCHMARK START - RAG: ${ragEnabled ? "ON" : "OFF"}`);
  console.log(`${"=".repeat(80)}\n`);

  const compiler = new Singleton(
    (listener: IAutoBeCompilerListener) => new AutoBeCompiler(listener),
  );
  const printer = new Singleton(printState);

  const baseVendors = TestGlobal.getArguments("vendor") ?? [
    "anthropic/claude-sonnet-4.5",
  ];
  const projects = TestGlobal.getArguments("project")?.filter(
    typia.createIs<AutoBeExampleProject>(),
  ) ?? ["todo"];

  // Add RAG suffix to vendors for directory separation
  const ragSuffix = ragEnabled ? "-rag-on" : "-rag-off";
  const vendors = baseVendors.map((v) => `${v}${ragSuffix}`);

  // Initialize metrics for each vendor/project combination
  for (const vendor of vendors) {
    for (const project of projects) {
      metricsMap.set(getMetricsKey(vendor, project), createMetrics(ragEnabled));
    }
  }

  let currentVendor = "";
  let currentProject = "";

  await AutoBeExampleBenchmark.execute(
    {
      createAgent: async (next) => {
        currentVendor = next.vendor;
        // Reset metrics start time when agent is created
        const key = getMetricsKey(currentVendor, currentProject);
        const metrics = metricsMap.get(key);
        if (metrics) {
          metrics.timing.startTime = Date.now();
        }

        // Remove RAG suffix to get actual vendor name for config
        const actualVendor = next.vendor.replace(/-rag-(on|off)$/, "");
        return new AutoBeAgent({
          vendor: TestGlobal.getVendorConfig(actualVendor),
          config: {
            locale: "en-US",
            timeout:
              TestGlobal.env.TIMEOUT && TestGlobal.env.TIMEOUT !== "NULL"
                ? Number(TestGlobal.env.TIMEOUT)
                : null,
          },
          compiler: (listener) => compiler.get(listener),
          histories: next.histories,
          tokenUsage: next.tokenUsage,
        });
      },
    },
    {
      vendors,
      projects,
      phases: (TestGlobal.getArguments("phase") as any) ?? undefined,
      progress: (state) => {
        printer.get(state);
        // Track current project from state
        for (const vendor of state.vendors) {
          for (const project of vendor.projects) {
            if (project.started_at && !project.completed_at) {
              currentProject = project.name;
            }
            if (project.completed_at) {
              const key = getMetricsKey(vendor.name, project.name);
              const metrics = metricsMap.get(key);
              if (metrics && metrics.timing.endTime === null) {
                finalizeMetrics(metrics);
              }
            }
          }
        }
      },
      on: (event) => {
        const key = getMetricsKey(currentVendor, currentProject);
        const metrics = metricsMap.get(key);
        if (metrics) {
          trackEvent(metrics, event);
        }
      },
    },
  );

  // Print summary
  printMetricsSummary();

  // Archive analyze outputs per run (timestamped)
  for (const key of metricsMap.keys()) {
    const [vendor, project] = key.split("::");
    try {
      await archiveAnalyzeOutputs(vendor, project);
    } catch {}
  }
  console.log(
    `\nAnalyze outputs archived to: ${TestGlobal.ROOT}/benchmark-runs/${runId}`,
  );
};

global.process.on("uncaughtException", (error) => {
  console.log("uncaughtException", error);
});
global.process.on("unhandledRejection", (error) => {
  console.log("unhandledRejection", error);
});
main().catch(console.error);
