import { MicroAgentica, MicroAgenticaHistory } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { ConditionVariable, IPointer, Singleton, sleep_for } from "tstl";

import { AutoBeTimeoutError } from "./AutoBeTimeoutError";

export namespace TimedConversation {
  export interface IProps<Model extends ILlmSchema.Model> {
    agent: MicroAgentica<Model>;
    message: string;
    timeout: number | null;
  }
  export type IResult<Model extends ILlmSchema.Model> =
    | ISuccessResult<Model>
    | ITimeoutResult
    | IErrorResult;
  export interface ISuccessResult<Model extends ILlmSchema.Model> {
    type: "success";
    histories: MicroAgenticaHistory<Model>[];
  }
  export interface ITimeoutResult {
    type: "timeout";
    error: AutoBeTimeoutError;
  }
  export interface IErrorResult {
    type: "error";
    error: Error;
  }

  export const process = async <Model extends ILlmSchema.Model>(
    props: IProps<Model>,
  ): Promise<IResult<Model>> => {
    if (props.timeout === null)
      try {
        const histories: MicroAgenticaHistory<Model>[] =
          await props.agent.conversate(props.message);
        return {
          type: "success",
          histories,
        };
      } catch (error) {
        return {
          type: "error",
          error: error as Error,
        };
      }

    // PREPARE TIMEOUT HANDLERS
    const result: IPointer<IResult<Model> | null> = {
      value: null,
    };
    const holder: ConditionVariable = new ConditionVariable();
    const abort: AbortController = new AbortController();
    const timeout: Singleton<NodeJS.Timeout> = new Singleton(() =>
      setTimeout(() => {
        if (result.value !== null) return;
        result.value = {
          type: "timeout",
          error: new AutoBeTimeoutError(`Timeout, over ${props.timeout} ms.`),
        };
        abort.abort(`Timeout, over ${props.timeout} ms`);
        void holder.notify_all().catch(() => {});
      }, props.timeout!),
    );

    // DO CONVERSATE
    props.agent.on("request", () => {
      timeout.get();
    });
    props.agent
      .conversate(props.message, {
        abortSignal: abort.signal,
      })
      .then(
        (v) =>
          (result.value ??= {
            type: "success",
            histories: v,
          }),
      )
      .catch(
        (e) =>
          (result.value ??= {
            type: "error",
            error: e as Error,
          }),
      )
      .finally(() => {
        void holder.notify_all().catch(() => {});
        clearTimeout(timeout.get());
      });

    await holder.wait();
    await sleep_for(0);
    return result.value!;
  };
}
