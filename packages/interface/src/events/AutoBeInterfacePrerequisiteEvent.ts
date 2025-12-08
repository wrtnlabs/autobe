import { AutoBeInterfacePrerequisite } from "../histories/contents/AutoBeInterfacePrerequisite";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted during the API prerequisite dependency analysis phase.
 *
 * This event is triggered when the Interface Prerequisite Agent analyzes API
 * operations to determine their prerequisite dependencies. It represents the
 * process of establishing which POST operations must be executed before a given
 * operation can succeed, ensuring proper resource creation order for E2E test
 * generation.
 *
 * The prerequisite analysis phase examines each API operation to identify
 * required resource dependencies based on path parameters, request body
 * schemas, and entity relationships. For example, a `PUT
 * /orders/{orderId}/items/{itemId}` operation would require `POST /orders` and
 * `POST /orders/{orderId}/items` as prerequisites to create the necessary
 * resources first.
 *
 * By extending multiple base interfaces, this event provides comprehensive
 * tracking capabilities including progress monitoring for batch operation
 * processing and token usage analytics for cost optimization.
 *
 * @author Samchon
 */
export interface AutoBeInterfacePrerequisiteEvent
  extends AutoBeEventBase<"interfacePrerequisite">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Array of operations with their analyzed prerequisite dependencies.
   *
   * Contains the {@link AutoBeInterfacePrerequisite} results that map each
   * analyzed API operation to its required prerequisite POST operations. Each
   * entry specifies which operations must be executed first to create the
   * necessary resources for the target operation to succeed.
   *
   * These prerequisite mappings are essential for generating valid E2E tests
   * that execute operations in the correct order, ensuring that required
   * resources exist before dependent operations are tested.
   */
  operations: AutoBeInterfacePrerequisite[];

  /**
   * Iteration number of the Prisma schema this prerequisite analysis was
   * performed for.
   *
   * Indicates which version of the Prisma schema and interface specification
   * this analysis reflects. This step number ensures that the prerequisite
   * mappings are aligned with the current database schema and API structure.
   *
   * The step value enables proper synchronization between prerequisite analysis
   * and the underlying schema definitions, ensuring that dependency chains
   * remain valid as the schema evolves through iterations.
   */
  step: number;
}
