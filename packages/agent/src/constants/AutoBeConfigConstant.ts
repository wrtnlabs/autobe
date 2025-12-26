/**
 * Default configuration constants for AutoBE agent behavior.
 *
 * These values balance performance, cost, and reliability across the entire
 * pipeline. Tuned through production usage to handle real-world LLM API
 * characteristics (rate limits, latency, failure rates) while maintaining
 * reasonable token costs and execution times.
 *
 * @author Samchon
 */
export const enum AutoBeConfigConstant {
  /**
   * Default retry attempts for LLM API failures and validation error
   * corrections.
   *
   * Used when user doesn't specify retry count in config. Covers two critical
   * failure modes: (1) transient API failures (rate limits, server errors,
   * network timeouts) handled by `randomBackoffRetry`, and (2) AI
   * hallucinations during function calling that produce invalid AST data.
   *
   * AI function calling frequently generates type-invalid AST or AST that
   * violates semantic rules. Orchestrators loop up to `retry` times, providing
   * validation feedback (from Typia runtime validation or AutoBE compiler
   * diagnostics) back to the AI for correction. This iterative feedback loop
   * transforms hallucinations into learning opportunities.
   *
   * Value of 4 balances correction success rate against latency: most
   * validation errors resolve within 2-3 attempts, while permanent issues
   * (fundamentally misunderstood requirements) fail fast rather than wasting
   * resources.
   */
  RETRY = 4,

  /**
   * Batch count for parallel operation processing.
   *
   * Controls how many batches `divideArray` creates when splitting large
   * operation lists for concurrent processing. Value of 2 provides optimal
   * balance: parallelizes work to reduce latency while keeping batch sizes
   * large enough for effective prompt caching. Higher values increase
   * parallelism but reduce cache hit rates.
   */
  INTERFACE_CAPACITY = 1,

  /**
   * Maximum iterations for RAG (Retrieval-Augmented Generation) loops.
   *
   * Limits how many times `AutoBePreliminaryController` can fetch additional
   * context before forcing completion. Prevents infinite loops when LLM
   * continuously requests more data without making progress. Value of 10
   * accommodates complex scenarios requiring multiple context rounds while
   * preventing runaway execution.
   */
  RAG_LIMIT = 10,

  /**
   * Default timeout for long-running operations in milliseconds (30 minutes).
   *
   * Prevents operations from hanging indefinitely when LLM APIs become
   * unresponsive. Value of 30 minutes accommodates complex generation tasks
   * (large projects with dozens of models/operations) while catching genuinely
   * stuck requests. Override via config for specialized scenarios.
   */
  TIMEOUT = 30 * 60 * 1000,

  /**
   * Default concurrency limit for parallel LLM API calls.
   *
   * Controls maximum simultaneous requests in `executeCachedBatch` when vendor
   * doesn't specify semaphore. Value of 16 balances throughput against API rate
   * limits and memory usage. Too high causes rate limit errors and resource
   * exhaustion; too low wastes potential parallelism.
   */
  SEMAPHORE = 8,
}
