import { IMicroAgenticaHistoryJson } from "@agentica/core";

/**
 * Prepared conversation context package for LLM interaction in orchestrators.
 *
 * Each orchestrator's history transformer function assembles this package by:
 *
 * 1. Filtering relevant conversation histories (user/assistant messages)
 * 2. Injecting system prompts specific to the current operation
 * 3. Adding context data as assistant messages (requirements, schemas, etc.)
 * 4. Attaching a final user command message to trigger the LLM action
 *
 * The complete package is passed to MicroAgentica's conversate method to
 * execute the specific AI task with proper context.
 *
 * @example
 *   ```typescript
 *   const history = transformAnalyzeWriteHistories(ctx, { scenario, file });
 *   const result = await ctx.conversate({
 *     histories: history.histories,
 *     userMessage: history.userMessage,
 *     // ...
 *   });
 *   ```
 */
export interface IAutoBeOrchestrateHistory {
  /**
   * Conversation history array containing system prompts, previous messages,
   * and context data formatted as assistant messages.
   */
  histories: IMicroAgenticaHistoryJson[];

  /**
   * Final user command message triggering the AI operation (e.g., "Write
   * requirement analysis report.", "Make database schema file please").
   */
  userMessage: string;
}
