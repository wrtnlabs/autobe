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
   * Value of 5 provides sufficient attempts for complex validation scenarios
   * while keeping latency reasonable. Most validation errors resolve within 2-3
   * attempts, but complex schema corrections may need additional cycles.
   * Permanent issues (fundamentally misunderstood requirements) still fail fast
   * rather than wasting resources.
   */
  VALIDATION_RETRY = 8,

  /**
   * Retry attempts specifically for AutoBE compiler error correction loops.
   *
   * Used by compiler/diagnostic passes that iteratively refine generated code
   * or AST based on compiler feedback (syntax errors, type errors, or invalid
   * transformations). Unlike the general `VALIDATION_RETRY` constant, this is
   * scoped to compilation and code-fix phases where each iteration tends to be
   * more expensive and has diminishing returns after a few attempts.
   *
   * Value of 5 provides a reasonable number of correction cycles for general
   * compiler issues. Most compiler issues are either resolved within the first
   * couple of passes or indicate a fundamental mismatch that won't benefit from
   * further attempts. For database schema corrections specifically, use
   * `DATABASE_CORRECT_RETRY` which allows more iterations due to the cascading
   * nature of schema errors.
   */
  COMPILER_RETRY = 4,

  /**
   * Retry attempts specifically for Prisma schema correction loops.
   *
   * Used by `orchestratePrismaCorrect` when iteratively fixing database schema
   * compilation errors. Prisma schema correction is particularly challenging
   * because errors often cascade (one fix reveals new errors) and require
   * multiple passes to fully resolve complex relationship and constraint
   * issues.
   *
   * Value of 20 is intentionally higher than `COMPILER_RETRY` because database
   * schema corrections tend to be incremental - each iteration typically fixes
   * one or two issues rather than resolving everything at once. The higher
   * limit accommodates complex schemas with many inter-model relationships
   * while still providing a reasonable bound to prevent infinite correction
   * loops.
   */
  DATABASE_CORRECT_RETRY = 20,

  /**
   * Retry attempts for LLM function-calling execution flows.
   *
   * Applied when orchestrators invoke tools/functions through LLM
   * function-calling interfaces (e.g., to resolve missing parameters, invalid
   * argument shapes, or misaligned tool selections). Unlike the general `RETRY`
   * constant (which also covers raw completion failures), this value is scoped
   * to the tighter loop around function-call planning and argument repair.
   *
   * Value of 3 reflects the higher cost of each function-calling cycle (tool
   * selection + argument generation + execution) compared to simple
   * completions. Empirically, most function-call issues are corrected within
   * 1–2 iterations once validation feedback is provided; additional attempts
   * beyond 3 rarely improve success rates but notably increase latency and
   * resource usage.
   */
  /**
   * Retry attempts for Two-Layer document extraction (Evidence + Semantic
   * Layer). Lower than the general validation retry because document extraction
   * is optional — a failed extraction simply sets `document: null` on the file
   * rather than blocking the pipeline.
   */
  DOCUMENT_RETRY = 2,

  FUNCTION_CALLING_RETRY = 3,

  /**
   * Retry attempts for the Analyze Phase.
   *
   * Used when the Analyze Phase fails to write the module, unit, or section.
   * Value of 15 provides generous retries for the Analyze Phase, which often
   * needs multiple iterations due to the complexity of module/unit/section
   * decomposition. Most issues resolve within a few passes, but the higher
   * limit accommodates complex files requiring many correction cycles. The
   * limit still prevents indefinite loops while allowing meaningful automatic
   * correction.
   */
  ANALYZE_RETRY = 15,

  /**
   * Maximum consecutive error threshold for fast-fail during the Analyze
   * Phase's hierarchical file processing.
   *
   * Used by `processFileHierarchical` in `orchestrateAnalyze` to detect
   * persistent failure patterns within a single file's Module → Unit → Section
   * pipeline. When errors occur consecutively without any successful sub-task
   * in between, the counter increments. If it reaches this threshold the entire
   * file processing is aborted immediately, preventing further wasted LLM calls
   * on a file that is unlikely to recover.
   *
   * Value of 5 allows transient failures (rate limits, occasional
   * hallucinations) to be tolerated while catching truly broken scenarios
   * (e.g., fundamentally invalid file structure, persistent API outages) before
   * they consume excessive resources.
   */
  ANALYZE_CONSECUTIVE_ERROR = 5,

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
  API_ERROR_RETRY = 3,

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
   * Default timeout for long-running operations in milliseconds (15 minutes).
   *
   * Prevents operations from hanging indefinitely when LLM APIs become
   * unresponsive. Value of 20 minutes accommodates complex generation tasks
   * (large projects with dozens of models/operations) while catching genuinely
   * stuck requests. Override via config for specialized scenarios.
   */
  TIMEOUT = 20 * 60 * 1000,

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
