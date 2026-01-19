import { AutoBeInterfaceGroup } from "../histories/contents/AutoBeInterfaceGroup";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Interface agent generates logical groups for organizing
 * API endpoints.
 *
 * This event occurs specifically in large-scale projects where the volume of
 * database entities and requirements necessitates dividing API generation into
 * manageable chunks. The Interface agent analyzes the Prisma schema structure
 * and creates organizational groups that partition the API development work
 * based on schema namespaces, file boundaries, or table prefix patterns.
 *
 * The groups generated in this event serve as the foundation for subsequent
 * endpoint generation cycles, ensuring that:
 *
 * - API organization mirrors database schema structure
 * - Each endpoint generation cycle handles a coherent subset of entities
 * - Complete coverage is achieved without overlap between groups
 * - Development can proceed in parallel across different groups
 *
 * This grouping phase is critical for maintaining scalability and consistency
 * in projects with extensive database schemas and complex business
 * requirements.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceGroupEvent
  extends AutoBeEventBase<"interfaceGroup">,
    AutoBeAggregateEventBase {
  /**
   * Analysis of the database schema structure and grouping needs.
   *
   * Documents the agent's understanding of namespaces, prefixes, organizational
   * patterns in the database, which entities naturally belong together, and
   * what business domains or functional areas can be identified.
   */
  analysis: string;

  /**
   * Rationale for the group design decisions.
   *
   * Explains why groups were organized this way, what entities are included
   * in each group, how grouping reflects database schema structure, and what
   * coverage is provided for all requirements.
   */
  rationale: string;

  /**
   * Array of API endpoint groups organized by Prisma schema structure.
   *
   * Each group represents a logical partition of the API based on database
   * schema organization. Groups are mutually exclusive (no entity appears in
   * multiple groups) and collectively exhaustive (all entities are covered).
   * The array typically contains 2-20 groups depending on the project scale and
   * schema complexity.
   *
   * These groups will be used by subsequent Interface agent invocations to
   * generate endpoints for specific subsets of the application.
   */
  groups: AutoBeInterfaceGroup[];

  /**
   * Iteration number of the requirements analysis this grouping reflects.
   *
   * Indicates which version of the requirements analysis and Prisma schema this
   * group organization is based on. This step number ensures that the API
   * grouping remains synchronized with evolving requirements and database
   * schema changes throughout the development lifecycle.
   *
   * The step value enables proper tracking of how API organization evolves as
   * the project requirements and data model are refined through iterations.
   */
  step: number;
}
