import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import fs from "fs";
import OpenAI from "openai";
import path from "path";
import process from "process";

import { TestFactory } from "./TestFactory";
import { TestGlobal } from "./TestGlobal";

async function main(): Promise<void> {
  // PREPARE ENVIRONMENT
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const tokenUsage: AutoBeTokenUsage = new AutoBeTokenUsage();
  const factory: TestFactory = {
    createAgent: (histories) =>
      new AutoBeAgent({
        model: "chatgpt",
        vendor: {
          api: new OpenAI({
            apiKey: TestGlobal.env.CHATGPT_API_KEY,
            baseURL: TestGlobal.env.CHATGPT_BASE_URL,
          }),
          model: "gpt-4.1",
          semaphore: Number(TestGlobal.getArguments("semaphore")?.[0] ?? "16"),
        },
        config: {
          locale: "en-US",
        },
        compiler,
        histories,
        tokenUsage,
      }),
  };
  const include: string[] = TestGlobal.getArguments("include");
  const exclude: string[] = TestGlobal.getArguments("exclude");
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
              JSON.stringify(tokenUsage, null, 2),
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
    Total: tokenUsage.root.aggregate.total.toLocaleString("en-US"),
    Input: tokenUsage.root.aggregate.input.total.toLocaleString("en-US"),
    Output: tokenUsage.root.aggregate.output.total.toLocaleString("en-US"),
    Analyze: tokenUsage.analyze.aggregate.total.toLocaleString("en-US"),
    Prisma: tokenUsage.prisma.aggregate.total.toLocaleString("en-US"),
    Interface: tokenUsage.interface.aggregate.total.toLocaleString("en-US"),
    Test: tokenUsage.test.aggregate.total.toLocaleString("en-US"),
    Realize: tokenUsage.realize.aggregate.total.toLocaleString("en-US"),
  });
  if (exceptions.length !== 0) process.exit(-1);
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
