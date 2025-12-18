import { MicroAgentica, MicroAgenticaHistory } from "@agentica/core";
import { ILlmSchema } from "@samchon/openapi";
import { ConditionVariable, IPointer, Singleton, sleep_for } from "tstl";

import { AutoBeTimeoutError } from "./AutoBeTimeoutError";

/**
 * Wraps LLM conversation with timeout enforcement and discriminated result
 * types.
 *
 * Prevents hanging indefinitely when LLM APIs become unresponsive or requests
 * take excessively long. Uses AbortController to cancel in-flight requests when
 * timeout expires. Returns discriminated union enabling callers to handle
 * success/timeout/error cases separately.
 *
 * @author Samchon
 */
export namespace TimedConversation {
  /** Configuration for timed conversation execution. */
  export interface IProps<Model extends ILlmSchema.Model> {
    /** MicroAgentica agent to execute conversation */
    agent: MicroAgentica<Model>;
    /** User message to send */
    message: string;
    /** Timeout in milliseconds, or null for no timeout */
    timeout: number | null;
  }

  /** Discriminated union of possible conversation outcomes. */
  export type IResult<Model extends ILlmSchema.Model> =
    | ISuccessResult<Model>
    | ITimeoutResult
    | IErrorResult;

  /** Successful conversation completion. */
  export interface ISuccessResult<Model extends ILlmSchema.Model> {
    type: "success";
    histories: MicroAgenticaHistory<Model>[];
  }

  /** Conversation exceeded timeout limit. */
  export interface ITimeoutResult {
    type: "timeout";
    error: AutoBeTimeoutError;
  }

  /** Conversation failed with error other than timeout. */
  export interface IErrorResult {
    type: "error";
    error: Error;
  }

  /**
   * Executes conversation with optional timeout enforcement.
   *
   * If timeout is null, executes without time limit. Otherwise, sets up timeout
   * handler that aborts the request and returns timeout result. Uses condition
   * variable for synchronization between conversation and timeout threads.
   *
   * @param props Agent, message, and timeout configuration
   * @returns Discriminated result indicating success, timeout, or error
   */
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
