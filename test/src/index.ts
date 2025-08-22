import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { IAutoBeCompilerListener } from "@autobe/interface";
import { AutoBePlaygroundServer } from "@autobe/playground-server";
import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import fs from "fs";
import OpenAI from "openai";
import path from "path";
import process from "process";

import { TestFactory } from "./TestFactory";
import { TestGlobal } from "./TestGlobal";

async function main(): Promise<void> {
  console.log("---------------------------------------------------");
  console.log("AutoBE Test Program");
  console.log("Test Start Time", new Date().toLocaleString("en-US"));
  console.log("---------------------------------------------------");

  // PREPARE ENVIRONMENT
  const backend: AutoBePlaygroundServer = new AutoBePlaygroundServer();
  const tokenUsage: AutoBeTokenUsage = new AutoBeTokenUsage();
  const factory: TestFactory = {
    getTokenUsage: () => tokenUsage,
    createAgent: (histories) =>
      new AutoBeAgent({
        model: TestGlobal.env.SCHEMA_MODEL ?? "chatgpt",
        vendor: {
          api: new OpenAI({
            apiKey: TestGlobal.env.API_KEY,
            baseURL: TestGlobal.env.BASE_URL,
          }),
          model:
            TestGlobal.getArguments("vendor")?.[0] ??
            TestGlobal.env.VENDOR_MODEL ??
            "gpt-4.1",
          semaphore: Number(TestGlobal.getArguments("semaphore")?.[0] ?? "16"),
        },
        config: {
          locale: "en-US",
        },
        compiler: (listener) => new AutoBeCompiler(listener),
        histories,
        tokenUsage,
      }),
    createCompiler: (
      listener: IAutoBeCompilerListener = {
        realize: {
          test: {
            onOperation: async () => {},
            onReset: async () => {},
          },
        },
      },
    ) => new AutoBeCompiler(listener),
  };
  const include: string[] = TestGlobal.getArguments("include") ?? [];
  const exclude: string[] = TestGlobal.getArguments("exclude") ?? [];
  const runsPerScenario: number = Number(
    TestGlobal.env.BENCHMARK_RUNS_PER_SCENARIO ?? "1",
  );
  const scenarioResult = new Map<
    string,
    {
      success: number;
    }
  >();

  // DO TEST
  await backend.open();
  const exceptions: Error[] = await new Array(runsPerScenario)
    .fill(0)
    .reduce(async (acc, _) => {
      const prev = await acc;
      const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
        prefix: "test_",
        location: path.join(__dirname, "features"),
        parameters: () => [factory],
        onComplete: (exec: DynamicExecutor.IExecution) => {
          fs.promises
            .writeFile(
              `${TestGlobal.ROOT}/tokenUsage.log`,
              JSON.stringify(tokenUsage),
              "utf8",
            )
            .catch(() => {});

          const trace = (str: string) => {
            const success: number = scenarioResult.get(exec.name)?.success ?? 0;
            console.log(
              `  - ${chalk.green(exec.name)}(${success}/${runsPerScenario}): ${str}`,
            );
          };

          if (exec.value === false) {
            trace(chalk.gray("Pass"));
            return;
          }
          if (exec.error !== null) {
            trace(chalk.red(exec.error.name));
            return;
          }

          const scenarioMetaData = scenarioResult.get(exec.name);
          if (scenarioMetaData === undefined) {
            scenarioResult.set(exec.name, { success: 1 });
          } else {
            scenarioResult.set(exec.name, {
              success: scenarioMetaData.success + 1,
            });
          }

          const elapsed: number =
            new Date(exec.completed_at).getTime() -
            new Date(exec.started_at).getTime();
          trace(`${chalk.yellow(elapsed.toLocaleString())} ms`);
        },
        filter: (name) =>
          (include.length ? include.some((str) => name.includes(str)) : true) &&
          (exclude.length ? exclude.every((str) => !name.includes(str)) : true),
        extension: "ts",
      });

      const exceptions: Error[] = report.executions
        .filter((exec) => exec.error !== null)
        .map((exec) => exec.error!);

      if (exceptions.length === 0) {
        console.log("Success");
        console.log("Elapsed time", report.time.toLocaleString(), `ms`);
      } else {
        for (const exp of exceptions) {
          console.log(exp);
        }
        console.log("Failed");
        console.log("Elapsed time", report.time.toLocaleString(), `ms`);
      }

      return [...prev, ...exceptions];
    }, Promise.resolve([]));

  console.log("Token Usage");
  console.table({
    Total: tokenUsage.aggregate.total.toLocaleString("en-US"),
    Input: tokenUsage.aggregate.input.total.toLocaleString("en-US"),
    Output: tokenUsage.aggregate.output.total.toLocaleString("en-US"),
    Facade: tokenUsage.facade.total.toLocaleString("en-US"),
    Analyze: tokenUsage.analyze.total.toLocaleString("en-US"),
    Prisma: tokenUsage.prisma.total.toLocaleString("en-US"),
    Interface: tokenUsage.interface.total.toLocaleString("en-US"),
    Test: tokenUsage.test.total.toLocaleString("en-US"),
    Realize: tokenUsage.realize.total.toLocaleString("en-US"),
  });
  await backend.close();
  if (exceptions.length !== 0) process.exit(-1);
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
