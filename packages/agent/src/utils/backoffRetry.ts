/*
 * Random exponential backoff retry utility for handling rate limits
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 5) */
  maxRetries: number;
  /** Base delay in milliseconds (default: 2000) */
  baseDelay: number;
  /** Maximum delay in milliseconds (default: 60_000) */
  maxDelay: number;
  /** Jitter factor for randomization (0-1, default: 0.3) */
  jitter: number;
  /** Function to determine if error should trigger retry (default: isRetryError) */
  handleError: (error: any) => boolean;
}

/**
 * @param fn Function to Apply the retry logic.
 * @param maxRetries How many time to try. Max Retry is 5.
 * @returns
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
