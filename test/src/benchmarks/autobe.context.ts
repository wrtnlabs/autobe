import { AsyncLocalStorage } from "async_hooks";

import { FinishEvaluateMessageType } from "./client.agent";

export interface AutobeBenchmarkContext {
  runId: string;
  logsDir: string;
  generatedFiles: Record<string, string>;
  stages: {
    analyze: {
      startTime: number;
      endTime?: number;
      output?: unknown;
    };
    prisma: {
      startTime: number;
      endTime?: number;
      output?: unknown;
    };
    interface: {
      startTime: number;
      endTime?: number;
      output?: unknown;
    };
  };
  result?: FinishEvaluateMessageType;
}

const AutobeContextStorage = new AsyncLocalStorage<AutobeBenchmarkContext>();

export function getAutobeContext(): AutobeBenchmarkContext {
  return AutobeContextStorage.getStore()!;
}

export function withAutobeContext<T>(
  context: AutobeBenchmarkContext,
  callback: () => Promise<T> | T,
): Promise<T> {
  return AutobeContextStorage.run(context, async () => {
    return await callback();
  });
}
