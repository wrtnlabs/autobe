import { AutoBeDatabase } from "../database";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Database agent reviews and validates the component
 * organization during the database design process.
 *
 * This event occurs after the initial component extraction phase, where the
 * Database agent has organized tables into domain-based groups. The review
 * validates the component organization against business requirements, checks
 * for missing or duplicated tables, verifies domain fitness, and ensures proper
 * dependency ordering between components.
 *
 * The review process ensures that the component structure provides a solid
 * foundation for schema generation by identifying and correcting organizational
 * issues before detailed table schemas are created.
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentReviewEvent
  extends AutoBeEventBase<"databaseComponentReview">,
    AutoBeAggregateEventBase,
    AutoBeProgressEventBase {
  /**
   * Comprehensive review analysis of the component organization.
   *
   * Contains the AI agent's detailed evaluation of the component structure
   * including validation of table completeness, domain fitness, dependency
   * ordering, and naming conventions. The review identifies potential issues
   * and confirms adherence to domain-driven design principles.
   *
   * **Review Dimensions:**
   *
   * - **Table Completeness**: Verifies all required tables are included
   * - **Duplication Check**: Ensures no table appears in multiple components
   * - **Domain Fitness**: Validates tables are in appropriate business domains
   * - **Dependency Order**: Confirms component ordering respects FK relationships
   * - **Naming Conventions**: Verifies snake_case, plural forms, prefix rules
   * - **Normalization Patterns**: Checks separate entity and polymorphic patterns
   */
  review: string;

  /**
   * Strategic plan for component organization improvements.
   *
   * Contains the planning document outlining identified issues and proposed
   * corrections to the component structure. This plan guides the modifications
   * needed to ensure optimal domain organization.
   */
  plan: string;

  /**
   * The reviewed component with updated table list.
   *
   * Contains the complete component definition after review, including any
   * tables that were added, removed, or renamed. This replaces the original
   * component in the final organization used for schema generation.
   */
  modification: AutoBeDatabase.IComponent;

  /**
   * Iteration number of the requirements analysis this component review was
   * performed for.
   *
   * Indicates which version of the requirements analysis this review reflects.
   * This step number ensures that the component review is aligned with the
   * current requirements and helps track the evolution of database architecture
   * as business requirements change.
   */
  step: number;
}
