import { DynamicExecutor } from "@nestia/e2e";
import chalk from "chalk";
import { sleep_for } from "tstl";

import { MyConfiguration } from "../src/MyConfiguration";
import api from "../src/api";
import { ArgumentParser } from "./helpers/ArgumentParser";

export namespace TestAutomation {
  export interface IProps<T> {
    open(options: IOptions): Promise<T>;
    close(backend: T): Promise<void>;
  }

  export interface IOptions {
    simultaneous: number;
    include?: string[];
    exclude?: string[];
  }

  export const execute = async <T>(props: IProps<T>): Promise<void> => {
    // OPEN BACKEND
    const options: IOptions = await getOptions();
    const backend: T = await props.open(options);

    // DO TEST
    const connection: api.IConnection = {
      host: `http://127.0.0.1:${MyConfiguration.API_PORT()}`,
    };
    const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
      prefix: "test",
      location: __dirname + "/features",
      parameters: () => [
        {
          host: connection.host,
          encryption: connection.encryption,
        },
      ],
      filter: (func) =>
        (!options.include?.length ||
          (options.include ?? []).some((str) => func.includes(str))) &&
        (!options.exclude?.length ||
          (options.exclude ?? []).every((str) => !func.includes(str))),
      onComplete: (exec) => {
        const trace = (str: string) =>
          console.log(`  - ${chalk.green(exec.name)}: ${str}`);
        if (exec.error === null) {
          const elapsed: number =
            new Date(exec.completed_at).getTime() -
            new Date(exec.started_at).getTime();
          trace(`${chalk.yellow(elapsed.toLocaleString())} ms`);
        } else trace(chalk.red(exec.error.name));
      },
      simultaneous: options.simultaneous,
    });

    // TERMINATE - WAIT FOR BACKGROUND EVENTS
    await sleep_for(2500);
    await props.close(backend);

    const failures: DynamicExecutor.IExecution[] = report.executions.filter(
      (exec) => exec.error !== null,
    );
    if (failures.length === 0) {
      console.log("Success");
      console.log("Elapsed time", report.time.toLocaleString(), `ms`);
    } else {
      for (const f of failures) console.log(f.error);
      process.exit(-1);
    }

    console.log(
      [
        `All: #${report.executions.length}`,
        `Success: #${report.executions.length - failures.length}`,
        `Failed: #${failures.length}`,
      ].join("\n"),
    );
  };
}

const getOptions = () =>
  ArgumentParser.parse<TestAutomation.IOptions>(
    async (command, prompt, action) => {
      command.option(
        "--simultaneous <number>",
        "number of simultaneous requests",
      );
      command.option("--include <string...>", "include feature files");
      command.option("--exclude <string...>", "exclude feature files");

      return action(async (options) => {
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
