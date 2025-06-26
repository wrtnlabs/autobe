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

  // DO TEST
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    prefix: "test_",
    location: path.join(__dirname, "features"),
    parameters: () => [factory],
    onComplete: (exec: DynamicExecutor.IExecution) => {
      const trace = (str: string) =>
        console.log(`  - ${chalk.green(exec.name)}: ${str}`);
      if (exec.value === false) {
        trace(chalk.gray("Pass"));
      } else if (exec.error === null) {
        const elapsed: number =
          new Date(exec.completed_at).getTime() -
          new Date(exec.started_at).getTime();
        trace(`${chalk.yellow(elapsed.toLocaleString())} ms`);
      } else {
        trace(chalk.red(exec.error.name));
      }
      fs.promises
        .writeFile(
          `${TestGlobal.ROOT}/tokenUsage.log`,
          JSON.stringify(tokenUsage, null, 2),
          "utf8",
        )
        .catch(() => {});
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

  console.log("Token Usage");
  console.table([
    {
      component: "Total",
      value: tokenUsage.aggregate.total,
    },
    {
      component: "Input",
      value: tokenUsage.aggregate.input.total,
    },
    {
      component: "Output",
      value: tokenUsage.aggregate.output.total,
    },
  ]);
  if (exceptions.length !== 0) process.exit(-1);
}
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
