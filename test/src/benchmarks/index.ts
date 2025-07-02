import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import fs from "fs";
import OpenAI from "openai";
import { Semaphore } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { getAutobeContext, withAutobeContext } from "./autobe.context";
import {
  ClientAgent,
  FinishEvaluateMessageType,
  getClientAgent,
  transformAutobeHistoriesForClient,
} from "./client.agent";
import { BenchmarkLogger, createLogsDirectory } from "./logger";
import { generateReport } from "./report";
import { scenarios } from "./scenarios";
import { IScenario } from "./scenarios/types";
import { formatDurationSecondsFromMs } from "./utils/time-utils";

main().catch(console.error);

async function main() {
  const logsDir = createLogsDirectory(
    `${new Date().valueOf()}-${crypto.randomUUID()}`,
  );
  const logger = new BenchmarkLogger(logsDir);

  const factory = {
    createAgent: (scenario: IScenario) => {
      const autobe = new AutoBeAgent({
        model: "chatgpt",
        vendor: {
          api: new OpenAI({
            apiKey: TestGlobal.env.CHATGPT_API_KEY,
            baseURL: TestGlobal.env.CHATGPT_BASE_URL,
            maxRetries: 30,
          }),
          semaphore: Number(TestGlobal.env.OPENAI_SEMAPHORE ?? "32"),
          model: "gpt-4.1",
        },
        config: {
          locale: "en-US",
        },
        compiler: new AutoBeCompiler(),
        tokenUsage: new AutoBeTokenUsage(),
      });
      const semaphore = autobe.getContext().vendor.semaphore as Semaphore;
      const clientAgent = getClientAgent(scenario, semaphore);

      return { autobe, clientAgent };
    },
  } as const;

  const runsPerScenario = Number(process.env.BENCHMARK_RUNS_PER_SCENARIO ?? 2);

  await runBenchmarks({
    scenarios,
    runsPerScenario,
    factory,
    logger,
    parallel: 100,
  });
}

async function runBenchmarks(props: {
  scenarios: IScenario[];
  runsPerScenario: number;
  factory: {
    createAgent: (scenario: IScenario) => {
      autobe: AutoBeAgent<"chatgpt">;
      clientAgent: ClientAgent;
    };
  };
  logger: BenchmarkLogger;
  parallel?: number;
}) {
  const { scenarios, runsPerScenario, factory, logger, parallel = 1 } = props;
  const semaphore = new Semaphore(parallel);

  const startTime = Date.now();
  let completedRuns = 0;
  const runner = scenarios.flatMap((scenario) => {
    return Array.from({ length: runsPerScenario }).map(async () => {
      await semaphore.acquire();
      const { autobe, clientAgent } = factory.createAgent(scenario);
      try {
        const runId = `${scenario.name}-${performance.now()}-${crypto.randomUUID()}`;
        const result = await withAutobeContext(
          {
            logsDir: logger.logsDir,
            runId,
            stages: {
              analyze: {
                startTime: Date.now(),
                endTime: undefined,
                output: undefined,
              },
              prisma: {
                startTime: 0,
                endTime: undefined,
                output: undefined,
              },
              interface: {
                startTime: 0,
                endTime: undefined,
                output: undefined,
              },
            },
            generatedFiles: {},
          },
          () =>
            runBenchmark({
              scenario,
              autobe,
              clientAgent,
              log: (message: string, level?: "INFO" | "ERROR" | "WARN") =>
                logger.log(runId, message, level),
            }).finally(() => {
              {
                const context = getAutobeContext();
                fs.promises
                  .writeFile(
                    `${context.logsDir}/${context.runId}/report.json`,
                    JSON.stringify(context, null, 2),
                    "utf8",
                  )
                  .catch(() => {});
              }
            }),
        );
        return result;
      } finally {
        completedRuns++;
        console.log(
          `Completed runs: ${completedRuns} / ${scenarios.length * runsPerScenario}`,
        );
        semaphore.release().catch(() => {});
      }
    });
  });

  const results = await Promise.all(runner);
  const report = generateReport(results, startTime);
  console.log(report);
  fs.promises
    .writeFile(`${logger.logsDir}/report.txt`, report, "utf8")
    .catch(() => {});
  return results;
}

async function runBenchmark(props: {
  scenario: IScenario;
  autobe: AutoBeAgent<"chatgpt">;
  clientAgent: ClientAgent;
  log: (message: string, level?: "INFO" | "ERROR" | "WARN") => void;
}) {
  const { scenario, autobe, clientAgent, log } = props;

  registerAutobeEvents(autobe, log);
  const failedCount = {
    prisma: 0,
    interface: 0,
  };
  try {
    const histories = await autobe.conversate(scenario.requirements.analyze);
    while (true) {
      const res = await clientAgent.conversate(
        histories.flatMap(transformAutobeHistoriesForClient),
      );
      const context = getAutobeContext();
      fs.promises
        .writeFile(
          `${context.logsDir}/${context.runId}/histories.log`,
          JSON.stringify(histories, null, 2),
          "utf8",
        )
        .catch(() => {});
      if (typia.is<FinishEvaluateMessageType>(res)) {
        if (context.stages.prisma.endTime === undefined) {
          if (failedCount.prisma > 10) {
            throw new Error("prismaEnd is not called. (failedCount > 10)");
          }
          log(`prismaEnd is not called.`, "WARN");
          histories.push(
            ...(await autobe.conversate(
              "Now, I need to create a prisma schema. please create prisma schema. if you have prisma schema, it is failed compile. please retry.",
            )),
          );
          failedCount.prisma++;
          continue;
        }

        if (context.stages.interface.endTime === undefined) {
          if (failedCount.interface > 10) {
            throw new Error("interfaceEnd is not called. (failedCount > 10)");
          }
          log(`interfaceEnd is not called.`, "WARN");
          histories.push(
            ...(await autobe.conversate(
              "Now, I need to create an interface. please create interface.",
            )),
          );
          failedCount.interface++;
          continue;
        }
        context.result = res;
        break;
      }

      if (!res.content) {
        console.error("No content in response", JSON.stringify(res, null, 2));
        throw new Error("No content in response");
      }
      histories.push(...(await autobe.conversate(res.content)));
    }
  } catch (e) {
    console.error("error", e);
    log(`error: ${e}`, "ERROR");
    return { context: getAutobeContext(), agent: props.autobe, success: false };
  }
  log("Benchmark completed");
  return { context: getAutobeContext(), agent: props.autobe, success: true };
}

async function registerAutobeEvents(
  autobe: AutoBeAgent<"chatgpt">,
  log: (message: string, level?: "INFO" | "ERROR" | "WARN") => void,
) {
  autobe.on("userMessage", (event) => {
    if (event.type === "userMessage") {
      log(`userMessage: ${JSON.stringify(event.contents, null, 2)}`);
    }
  });
  autobe.on("assistantMessage", (event) => {
    if (event.type === "assistantMessage") {
      log(`assistantMessage: ${JSON.stringify(event.text, null, 2)}`);
    }
  });
  autobe.on("analyzeStart", () => {
    const context = getAutobeContext();
    console.log(`[${context.runId}] - analyzeStart`);
    context.stages.analyze.startTime = Date.now();
  });

  autobe.on("prismaStart", () => {
    const context = getAutobeContext();
    console.log(`[${context.runId}] - prismaStart`);
    context.stages.prisma.startTime = Date.now();
  });

  autobe.on("interfaceStart", () => {
    const context = getAutobeContext();
    console.log(`[${context.runId}] - interfaceStart`);
    context.stages.interface.startTime = Date.now();
  });

  autobe.on("analyzeComplete", async (event) => {
    log(
      `Received analyzeComplete event with ${Object.keys(event.files || {}).length} files`,
    );
    const context = getAutobeContext();
    context.stages.analyze.endTime = Date.now();
    context.stages.analyze.output = Object.keys(event.files || {}).join(", ");

    // Save generated files
    Object.entries(event.files || {}).forEach(([filename, content]) => {
      context.generatedFiles[`analyze/${filename}`] = content;
    });

    // REPORT RESULT
    await FileSystemIterator.save({
      root: `${context.logsDir}/${context.runId}/analyze`,
      files: event.files,
    });

    const duration =
      context.stages.analyze.endTime - context.stages.analyze.startTime;
    log(
      `Analysis stage completed successfully in ${formatDurationSecondsFromMs(duration)}`,
    );
    log(`Analysis files: ${Object.keys(event.files || {}).join(", ")}`);
    console.log(
      `[${context.runId}] ✅ Analysis stage completed in ${formatDurationSecondsFromMs(duration)}`,
    );
  });

  autobe.on("prismaComplete", async (event) => {
    const context = getAutobeContext();
    const endTime = Date.now();
    context.stages.prisma.output = Object.keys(event.schemas || {}).join(", ");
    const duration = endTime - context.stages.prisma.startTime;
    log(
      `PrismaComplete event contents: schemas=${Object.keys(event.schemas || {}).length} files, compiled=${event.compiled?.type}`,
    );

    // Save generated schemas
    Object.entries(event.schemas || {}).forEach(([filename, content]) => {
      context.generatedFiles[`prisma/${filename}`] = content;
    });

    // REPORT RESULT
    // Save Prisma schema files to log directory for result tracking
    await FileSystemIterator.save({
      root: `${context.logsDir}/${context.runId}/prisma`,
      files: event.schemas,
    });

    if (event.compiled.type !== "success" || "errors" in event.compiled) {
      const errors = (event.compiled as any).errors || ["Compilation failed"];
      log(`Prisma compilation failed: ${errors.join(", ")}`, "ERROR");
    } else {
      log(
        `Prisma stage completed successfully in ${formatDurationSecondsFromMs(duration)}`,
      );
      log(`Prisma schemas: ${Object.keys(event.schemas || {}).join(", ")}`);

      context.stages.prisma.endTime = endTime;
      console.log(
        `[${context.runId}] ✅ Prisma stage completed in ${formatDurationSecondsFromMs(duration)}`,
      );
    }
  });

  autobe.on("interfaceComplete", async (event) => {
    const context = getAutobeContext();
    context.stages.interface.endTime = Date.now();
    context.stages.interface.output = Object.keys(event.files || {}).join(", ");
    const duration =
      context.stages.interface.endTime - context.stages.interface.startTime;
    log(
      `InterfaceComplete event contents: files=${Object.keys(event.files || {}).length} files, document=${!!event.document}`,
    );
    log(`Processing interfaceComplete event in correct stage`);

    // Save generated interface files
    Object.entries(event.files || {}).forEach(([filename, content]) => {
      context.generatedFiles[`interface/${filename}`] = content;
    });

    // REPORT RESULT
    await FileSystemIterator.save({
      root: `${context.logsDir}/${context.runId}/interface`,
      files: event.files,
    });

    log(
      `Interface stage completed successfully in ${formatDurationSecondsFromMs(duration)}`,
    );
    log(`Interface files: ${Object.keys(event.files || {}).join(", ")}`);
    console.log(
      `[${context.runId}] ✅ Interface stage completed in ${formatDurationSecondsFromMs(duration)}`,
    );
  });
}
