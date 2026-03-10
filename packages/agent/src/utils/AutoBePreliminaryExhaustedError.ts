/**
 * Custom error indicating RAG loop exhausted all retry attempts.
 *
 * Thrown by `AutoBePreliminaryController.orchestrate()` when the LLM repeatedly
 * requests more data without ever calling `complete`, exceeding
 * `AutoBeConfigConstant.RAG_LIMIT` iterations.
 *
 * Caught alongside `AutoBeTimeoutError` in orchestration pipelines to trigger
 * force-pass behavior instead of crashing the entire process.
 *
 * @author Samchon
 */
export class AutoBePreliminaryExhaustedError extends Error {
  public constructor(message?: string) {
    super(
      message ?? "Preliminary process exceeded the maximum number of retries.",
    );

    const proto = new.target.prototype;
    if (Object.setPrototypeOf) Object.setPrototypeOf(this, proto);
    else {
      // biome-ignore lint: intended
      (this as any).__proto__ = proto;
    }
  }

  public get name(): string {
    return this.constructor.name;
  }
}
