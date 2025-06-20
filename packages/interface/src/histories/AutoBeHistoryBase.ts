import { tags } from "typia";

/**
 * Base interface for all agent history records in the system.
 *
 * Provides the fundamental structure and common properties shared by all
 * history types including message histories, development phase histories, and
 * agent activity records. This base interface ensures consistent
 * identification, typing, and temporal tracking across the entire vibe coding
 * pipeline.
 *
 * All history records inherit from this base to maintain uniformity in data
 * structure and enable comprehensive tracking of the development process from
 * initial user conversations through final code generation and deployment.
 *
 * @author Samchon
 */
export interface AutoBeAgentHistoryBase<Type extends string> {
  /**
   * Unique identifier for this history record.
   *
   * A UUID that uniquely identifies this specific history entry within the
   * system. This identifier enables precise referencing, cross-linking between
   * related history records, and maintaining referential integrity across the
   * development timeline and different agent activities.
   */
  id: string & tags.Format<"uuid">;

  /**
   * Type discriminator indicating the specific kind of history record.
   *
   * Provides type-safe discrimination between different history record types
   * such as "analyze", "prisma", "interface", "test", "realize", "userMessage",
   * and "assistantMessage". This enables proper type narrowing and ensures that
   * history records are processed according to their specific characteristics
   * and requirements.
   */
  type: Type;

  /**
   * ISO 8601 timestamp indicating when this history record was created.
   *
   * Marks the exact moment when this history entry was initiated or when the
   * corresponding agent activity began. This timestamp is fundamental for
   * maintaining chronological order, tracking development progress, and
   * understanding the temporal relationships between different phases of the
   * vibe coding process.
   */
  created_at: string & tags.Format<"date-time">;
}
