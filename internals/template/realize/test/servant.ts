import { DynamicExecutor } from "@nestia/e2e";
import { Driver, WorkerServer } from "tgrid";

import { MyBackend } from "../src/MyBackend";
import { MyGlobal } from "../src/MyGlobal";
import { IAutoBeRealizeTestConfig } from "./autobe/compiler/IAutoBeRealizeTestConfig";
import { IAutoBeRealizeTestListener } from "./autobe/compiler/IAutoBeRealizeTestListener";
import { IAutoBeRealizeTestOperation } from "./autobe/compiler/IAutoBeRealizeTestOperation";
import { IAutoBeRealizeTestResult } from "./autobe/compiler/IAutoBeRealizeTestResult";
import { IAutoBeRealizeTestService } from "./autobe/compiler/IAutoBeRealizeTestService";
import { TestAutomation } from "./helpers/TestAutomation";

class AutoBeRealizeTestService implements IAutoBeRealizeTestService {
  public constructor(
    private readonly listener: Driver<IAutoBeRealizeTestListener>,
  ) {}

  public async execute(
    config: IAutoBeRealizeTestConfig,
  ): Promise<IAutoBeRealizeTestResult> {
    const start: Date = new Date();
    const operations: IAutoBeRealizeTestOperation[] = [];
    await TestAutomation.execute({
      open: async (): Promise<MyBackend> => {
        const backend: MyBackend = new MyBackend();
        await backend.open();
        return backend;
      },
      close: (backend: MyBackend): Promise<void> => backend.close(),
      options: {
        reset: config.reset ?? true,
        simultaneous: config.simultaneous ?? 1,
      },
      onComplete: (exec: DynamicExecutor.IExecution): void => {
        const op: IAutoBeRealizeTestOperation = {
          name: exec.name,
          location: exec.location,
          value: exec.value,
          error: exec.error,
          started_at: exec.started_at,
          completed_at: exec.completed_at,
        };
        this.listener.onOperation(op).catch(() => {});
        operations.push(op);
      },
      onReset: (): void => {
        this.listener.onReset().catch(() => {});
      },
    });
    return {
      reset: config.reset ?? true,
      simultaneous: config.simultaneous ?? 1,
      operations,
      started_at: start.toISOString(),
      completed_at: new Date().toISOString(),
    };
  }
}

const main = async (): Promise<void> => {
  const worker: WorkerServer<
    null,
    IAutoBeRealizeTestService,
    IAutoBeRealizeTestListener
  > = new WorkerServer();
  const listener: Driver<IAutoBeRealizeTestListener> = worker.getDriver();
  const service: AutoBeRealizeTestService = new AutoBeRealizeTestService(
    listener,
  );

  MyGlobal.testing = true;
  await worker.open(service);
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
