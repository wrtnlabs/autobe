/** Configuration options for exponential backoff retry behavior. */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 5) */
  maxRetries: number;
  /** Base delay in milliseconds (default: 4000) */
  baseDelay: number;
  /** Maximum delay in milliseconds (default: 60000) */
  maxDelay: number;
  /** Jitter factor for randomization (0-1, default: 0.8) */
  jitter: number;
  /** Function to determine if error should trigger retry (default: isRetryError) */
  handleError: (error: any) => boolean;
}

/**
 * Retries failed LLM API calls with exponential backoff and jitter.
 *
 * Automatically retries transient failures (rate limits, server errors, network
 * issues) while immediately failing on permanent errors (quota exceeded,
 * invalid requests). Uses exponential backoff with randomized jitter to avoid
 * thundering herd problems when multiple concurrent requests fail
 * simultaneously.
 *
 * The retry logic is critical for production reliability: LLM APIs frequently
 * return temporary 429/5xx errors under heavy load, and network timeouts are
 * common. Without retry, these transient failures would cascade into
 * user-visible errors despite being automatically recoverable.
 *
 * @author Kakasoo
 * @param fn Async function to execute with retry logic
 * @param options Retry configuration (maxRetries, delays, error handler)
 * @returns Promise resolving to function result if successful
 * @throws Last encountered error if all retry attempts exhausted
 */
export async function randomBackoffRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const {
    maxRetries = 5,
    baseDelay = 4_000,
    maxDelay = 60_000,
    jitter = 0.8,
    handleError = isRetryError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxRetries - 1) throw err;

      if (!handleError(err)) throw err;

      const tempDelay = Math.min(baseDelay * 2 ** attempt, maxDelay);
      const delay = tempDelay * (1 + Math.random() * jitter);

      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw lastError;
}

/**
 * Calculates retry delay using exponential backoff with jitter.
 *
 * Throws immediately for non-retryable errors or when retry count exceeds 5.
 * Used by orchestrators that need explicit delay calculation without automatic
 * retry loop execution.
 *
 * @param props Retry count and error to evaluate
 * @returns Calculated delay in milliseconds
 * @throws Original error if non-retryable or max retries exceeded
 */
export function randomBackoffStrategy(props: {
  count: number;
  error: unknown;
}): number {
  const { count, error } = props;
  if (count > 5) {
    throw error;
  }

  if (isRetryError(error) === false) {
    throw error;
  }

  const baseDelay = 4_000;
  const maxDelay = 60_000;
  const jitter = 0.8;
  const tempDelay = Math.min(baseDelay * 2 ** count, maxDelay);
  const delay = tempDelay * (1 + Math.random() * jitter);

  return delay;
}

/**
 * Determines if an error represents a transient failure that should trigger
 * retry.
 *
 * Returns `true` for retryable errors (rate limits, server errors, network
 * issues) and `false` for permanent failures (quota exceeded, invalid
 * requests). This classification prevents wasting resources retrying
 * unrecoverable errors.
 *
 * @param error Error object from LLM API or network layer
 * @returns `true` if error is retryable, `false` otherwise
 */
function isRetryError(error: any): boolean {
  // 1) Quota exceeded → No retry
  if (
    error?.code === "insufficient_quota" ||
    error?.error?.type === "insufficient_quota"
  ) {
    return false;
  }

  // 2) 5xx / server_error → Retry
  if (
    (typeof error?.status === "number" && error.status >= 500) ||
    error?.error?.type === "server_error"
  ) {
    return true;
  }

  // 3) HTTP 429
  if (error?.status === 429) {
    return true;
  }

  // 4) undici / network related
  const code = error?.code || error?.cause?.code;
  if (
    [
      "UND_ERR_SOCKET",
      "UND_ERR_CONNECT_TIMEOUT",
      "ETIMEDOUT",
      "ECONNRESET",
      "EPIPE",
    ].includes(code)
  ) {
    return true;
  }

  // 5) fetch abort
  if (error?.message === "terminated" || error?.name === "AbortError") {
    return true;
  }

  if (
    (error?.message as string)?.startsWith(
      `SyntaxError: Expected ',' or '}' after property value in JSON at position`,
    )
  ) {
    return true;
  }

  return false;
}
