import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";

import { ArgumentParser } from "./ArgumentParser";
import { TestAutomation } from "./TestAutomation";

export namespace TestAutomationStdio {
  export const getOptions = () =>
    ArgumentParser.parse<TestAutomation.IOptions>(
      async (command, prompt, action) => {
        command.option("--reset <true|false>", "reset local DB or not");
        command.option(
          "--simultaneous <number>",
          "number of simultaneous requests",
        );
        command.option("--include <string...>", "include feature files");
        command.option("--exclude <string...>", "exclude feature files");

        return action(async (options) => {
          // reset
          if (typeof options.reset === "string")
            options.reset = options.reset === "true";
          options.reset ??= await prompt.boolean("reset")("Reset local DB");

          // simultaneous
          options.simultaneous = Number(
            options.simultaneous ??
              (await prompt.number("simultaneous")(
                "Number of simultaneous requests to make",
              )),
          );
          if (isNaN(options.simultaneous) || options.simultaneous <= 0)
            options.simultaneous = 1;
          return options as TestAutomation.IOptions;
        });
      },
    );

  export const onComplete = (exec: DynamicExecutor.IExecution): void => {
    const trace = (str: string) =>
      console.log(`  - ${chalk.green(exec.name)}: ${str}`);
    if (exec.error === null) {
      const elapsed: number =
        new Date(exec.completed_at).getTime() -
        new Date(exec.started_at).getTime();
      trace(`${chalk.yellow(elapsed.toLocaleString())} ms`);
    } else trace(chalk.red(exec.error.name));
  };

  export const onReset = (start: Date) => (): void => {
    const now: Date = new Date();
    console.log(
      `  - Reset DB: ${(now.getDate() - start.getDate()).toLocaleString()} ms`,
    );
  };

  export const report = (report: DynamicExecutor.IReport): void => {
    const exceptions: Error[] = report.executions
      .filter((exec) => exec.error !== null)
      .map((exec) => exec.error!);
    if (exceptions.length === 0) {
      console.log("Success");
      console.log("Elapsed time", report.time.toLocaleString(), `ms`);
    } else {
      for (const exp of exceptions) console.log(exp);
      console.log("Failed");
      console.log("Elapsed time", report.time.toLocaleString(), `ms`);
      process.exit(-1);
    }
  };
}
