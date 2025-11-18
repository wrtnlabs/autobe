import { AutoBeAnalyzeHistory } from "./AutoBeAnalyzeHistory";
import { AutoBeAssistantMessageHistory } from "./AutoBeAssistantMessageHistory";
import { AutoBeInterfaceHistory } from "./AutoBeInterfaceHistory";
import { AutoBePrismaHistory } from "./AutoBePrismaHistory";
import { AutoBeRealizeHistory } from "./AutoBeRealizeHistory";
import { AutoBeTestHistory } from "./AutoBeTestHistory";
import { AutoBeUserMessageHistory } from "./AutoBeUserMessageHistory";

/**
 * Union type representing all possible history records in the vibe coding
 * system.
 *
 * This comprehensive union encompasses both message histories that track
 * conversation flow and development histories that monitor progress through
 * various phases of the automated development pipeline. Each history type
 * captures specific aspects of the user interaction and agent activities that
 * transform conversations into working software.
 *
 * The union design enables type-safe handling of different history records
 * while maintaining a unified interface for storing, retrieving, and processing
 * the complete development timeline from initial requirements gathering to
 * final code generation.
 *
 * @author Samchon
 */
export type AutoBeHistory =
  | AutoBeUserMessageHistory
  | AutoBeAssistantMessageHistory
  | AutoBeAnalyzeHistory
  | AutoBePrismaHistory
  | AutoBeInterfaceHistory
  | AutoBeTestHistory
  | AutoBeRealizeHistory;

export namespace AutoBeHistory {
  /**
   * Type alias for extracting the discriminator union from history records.
   *
   * Provides a convenient way to reference all possible history type values
   * including "userMessage", "assistantMessage", "analyze", "prisma",
   * "interface", "test", and "realize". This type is useful for type guards,
   * switch statements, and other type-safe operations that need to handle
   * different history categories.
   */
  export type Type = AutoBeHistory["type"];

  /**
   * Type mapping interface that associates each history type string with its
   * corresponding history record interface.
   *
   * Enables type-safe access to specific history record types based on their
   * discriminator values. This mapper is particularly useful for generic
   * functions, type narrowing operations, and ensuring compile-time type safety
   * when working with history records in a type-dependent manner.
   *
   * The mapper provides a clean abstraction for converting between type strings
   * and their corresponding TypeScript interfaces, facilitating robust history
   * management and processing throughout the system.
   */
  export interface Mapper {
    userMessage: AutoBeUserMessageHistory;
    assistantMessage: AutoBeAssistantMessageHistory;
    analyze: AutoBeAnalyzeHistory;
    prisma: AutoBePrismaHistory;
    interface: AutoBeInterfaceHistory;
    test: AutoBeTestHistory;
    realize: AutoBeRealizeHistory;
  }
}
