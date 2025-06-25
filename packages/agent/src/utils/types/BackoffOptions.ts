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
