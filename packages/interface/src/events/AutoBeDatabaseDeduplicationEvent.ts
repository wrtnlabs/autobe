import { AutoBeDatabaseDeduplicationGroup } from "../histories/contents";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when an agent completes reviewing a single component for semantic
 * duplicates during the Database Component Deduplication phase.
 *
 * This event occurs after both Authorization Review and Component Review phases,
 * where deduplication agents compare each component's tables against all other
 * components' tables to identify semantically equivalent tables that serve the
 * same purpose.
 *
 * Multiple events of this type are emitted (one per component) as the
 * deduplication agents process each component in parallel.
 *
 * @author Michael
 */
export interface AutoBeDatabaseDeduplicationEvent
  extends AutoBeEventBase<"databaseDeduplication">,
    AutoBeAggregateEventBase,
    AutoBeProgressEventBase {
  /** Requirements analysis iteration step number. */
  step: number;

  /**
   * Analysis of the deduplication comparison process.
   *
   * Documents the agent's understanding of which tables were analyzed in the
   * target component and how they were compared against tables in other
   * components.
   */
  analysis: string;

  /**
   * Rationale for the duplicate group decisions.
   *
   * Explains why specific tables were grouped as duplicates and why certain
   * similar-looking tables were NOT grouped.
   */
  rationale: string;

  /**
   * Groups of semantically duplicate tables identified by the agent.
   *
   * Each group contains tables from different components that serve the same
   * purpose. May be empty if no duplicates were found for this component.
   */
  duplicateGroups: AutoBeDatabaseDeduplicationGroup[];

  /** Namespace of the component that was reviewed for duplicates. */
  namespace: string;
}
