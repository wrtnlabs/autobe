/**
 * Custom error indicating the cyclinic write-compile-correct loop exhausted all
 * retry attempts.
 *
 * Thrown by `AutoBeCyclinicController.orchestrate()` when the LLM repeatedly
 * fails to produce code that passes validation within the maximum allowed
 * iterations.
 *
 * Caught alongside `AutoBePreliminaryExhaustedError` and `AutoBeTimeoutError`
 * in orchestration pipelines to trigger force-pass behavior instead of crashing
 * the entire process.
 *
 * @author Samchon
 */
export class AutoBeCyclinicExhaustedError extends Error {
  public constructor(message?: string) {
    super(
      message ??
        "Cyclinic write-compile-correct loop exceeded the maximum number of iterations.",
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
