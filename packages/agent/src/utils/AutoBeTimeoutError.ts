/**
 * Custom error indicating LLM conversation exceeded configured timeout limit.
 *
 * Used by `TimedConversation` to wrap conversation operations with timeout
 * enforcement. When LLM response takes too long, this error is thrown to
 * distinguish timeout failures from other error types.
 *
 * The distinction is critical for retry logic: timeout errors are NOT retried
 * (immediate failure) while other errors can be retried. This prevents wasting
 * resources on conversations that are fundamentally too slow.
 *
 * @author Samchon
 */
export class AutoBeTimeoutError extends Error {
  /**
   * Creates timeout error with descriptive message.
   *
   * @param message Error description including timeout duration
   */
  public constructor(message: string) {
    super(message);

    const proto = new.target.prototype;
    if (Object.setPrototypeOf) Object.setPrototypeOf(this, proto);
    else (this as any).__proto__ = proto;
  }

  /** Returns error class name for identification. */
  public get name(): string {
    return this.constructor.name;
  }
}
