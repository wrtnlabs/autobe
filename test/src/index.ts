import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { IAutoBeCompilerListener } from "@autobe/interface";
import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import path from "path";
import process from "process";

import { TestGlobal } from "./TestGlobal";

async function main(): Promise<void> {
  console.log("---------------------------------------------------");
  console.log("AutoBE Test Program");
  console.log("Test Start Time", new Date().toLocaleString("en-US"));
  console.log("---------------------------------------------------");

  // PREPARE ENVIRONMENT
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
  const exceptions: Error[] = await new Array(runsPerScenario)
    .fill(0)
    .reduce(async (acc, _) => {
      const prev = await acc;
      const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
        prefix: "test_",
        location: path.join(__dirname, "features"),
        parameters: () => [],
        onComplete: (exec: DynamicExecutor.IExecution) => {
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
  if (exceptions.length !== 0) process.exit(-1);
}

global.process.on("uncaughtException", (error) => {
  console.log("exception", error);
});
global.process.on("unhandledRejection", (error) => {
  console.log("rejection", error);
});
main().catch((error) => {
  console.log("critical error", error);
  process.exit(-1);
});
