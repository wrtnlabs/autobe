import api from "@ORGANIZATION/PROJECT-api";
import { DynamicExecutor } from "@nestia/e2e";
import { sleep_for } from "tstl";

import { MyConfiguration } from "../../src/MyConfiguration";
import { MySetupWizard } from "../../src/setup/MySetupWizard";

export namespace TestAutomation {
  export interface IProps<T> {
    open(options: IOptions): Promise<T>;
    close(backend: T): Promise<void>;
    onComplete(exec: DynamicExecutor.IExecution): void;
    onReset(): void;
    options: IOptions;
  }

  export interface IOptions {
    reset: boolean;
    simultaneous: number;
    include?: string[];
    exclude?: string[];
  }

  export const execute = async <T>(
    props: IProps<T>,
  ): Promise<DynamicExecutor.IReport> => {
    // RESET
    if (props.options.reset === true) {
      await MySetupWizard.schema();
      await MySetupWizard.seed();
      await props.onReset();
    }

    // OPEN BACKEND
    const backend: T = await props.open(props.options);
    const connection: api.IConnection = {
      host: `http://127.0.0.1:${MyConfiguration.API_PORT()}`,
    };

    // DO TEST
    const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
      prefix: "test",
      location: __dirname + "/../features",
      parameters: () => [
        {
          host: connection.host,
        } satisfies api.IConnection,
      ],
      filter: (func) =>
        (!props.options.include?.length ||
          (props.options.include ?? []).some((str) => func.includes(str))) &&
        (!props.options.exclude?.length ||
          (props.options.exclude ?? []).every((str) => !func.includes(str))),
      onComplete: props.onComplete,
      simultaneous: props.options.simultaneous,
      extension: __filename.split(".").pop()!,
    });

    // TERMINATE
    await sleep_for(2500);
    await props.close(backend);
    return report;
  };
}
