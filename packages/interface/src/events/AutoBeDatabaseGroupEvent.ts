import { AutoBeDatabaseGroup } from "../histories/contents/AutoBeDatabaseGroup";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Database agent generates logical groups for organizing
 * database component extraction.
 *
 * This event occurs specifically in large-scale projects where the volume of
 * business requirements necessitates dividing database component generation
 * into manageable chunks. The Database agent analyzes the requirements and
 * creates organizational groups that partition the component extraction work
 * based on business domains and functional areas.
 *
 * The groups generated in this event serve as the foundation for subsequent
 * component extraction cycles, ensuring that:
 *
 * - Database organization mirrors business domain structure
 * - Each component extraction cycle handles a coherent subset of entities
 * - Complete coverage is achieved without overlap between groups
 * - Development can proceed efficiently with clear domain boundaries
 *
 * This grouping phase is critical for maintaining scalability and consistency
 * in projects with extensive business requirements and complex domain models.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseGroupEvent
  extends AutoBeEventBase<"databaseGroup">,
    AutoBeAggregateEventBase {
  /**
   * Array of database component groups organized by business domain.
   *
   * Each group represents a logical partition of the database based on
   * business requirements and domain analysis. Groups are mutually exclusive
   * (no component appears in multiple groups) and collectively exhaustive (all
   * components are covered). The array typically contains 2-10 groups
   * depending on the project scale and domain complexity.
   *
   * These groups will be used by subsequent Database agent invocations to
   * extract components for specific subsets of the application.
   */
  groups: AutoBeDatabaseGroup[];

  /**
   * Iteration number of the requirements analysis this grouping reflects.
   *
   * Indicates which version of the requirements analysis this group
   * organization is based on. This step number ensures that the database
   * grouping remains synchronized with evolving requirements throughout the
   * development lifecycle.
   *
   * The step value enables proper tracking of how database organization
   * evolves as the project requirements are refined through iterations.
   */
  step: number;
}
