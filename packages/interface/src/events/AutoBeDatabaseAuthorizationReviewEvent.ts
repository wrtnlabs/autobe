import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableRevise,
} from "../histories/contents";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Database agent reviews and validates the authorization
 * component's table organization during the database design process.
 *
 * This event occurs after the initial authorization table generation phase,
 * where the Database Authorization agent has created actor and session tables
 * for ALL actors in a single component. The review validates the authorization
 * tables against authentication requirements, checks for missing session tables
 * for each actor, verifies naming conventions, and ensures proper
 * actor-specific patterns.
 *
 * The review process ensures that the authorization component provides a solid
 * foundation for authentication and session management by identifying and
 * correcting organizational issues before detailed table schemas are created.
 *
 * @author Michael
 */
export interface AutoBeDatabaseAuthorizationReviewEvent
  extends
    AutoBeEventBase<"databaseAuthorizationReview">,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<
      | "analysisSections"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
    > {
  /**
   * Comprehensive review analysis of the authorization component organization.
   *
   * Contains the AI agent's detailed evaluation of the authorization component
   * structure including validation of actor table completeness, session table
   * presence, naming conventions, and authentication pattern compliance.
   *
   * **Review Dimensions:**
   *
   * - **Actor Table Completeness**: Verifies all actor types have main tables
   * - **Session Table Presence**: Ensures each actor has a session table
   * - **Authentication Support**: Checks for necessary auth support tables
   * - **Naming Conventions**: Verifies actor-based naming patterns
   * - **Normalization Patterns**: Checks separate entity patterns for auth
   */
  review: string;

  /**
   * Array of table revision operations applied during the review.
   *
   * Contains all create, update, and erase operations that were identified and
   * applied during the authorization review process. Each operation includes a
   * reason explaining why the change was necessary.
   *
   * - **Create**: Tables added to fulfill missing authentication requirements
   * - **Update**: Tables renamed to fix naming convention issues
   * - **Erase**: Tables removed because they don't belong to authorization
   */
  revises: AutoBeDatabaseComponentTableRevise[];

  /**
   * The reviewed authorization component with updated table list.
   *
   * Contains the complete authorization component definition after review, with
   * all revisions applied. Tables that were added, removed, or renamed are
   * reflected in this final component structure.
   */
  modification: AutoBeDatabaseComponent;

  /**
   * Iteration number of the requirements analysis this authorization review was
   * performed for.
   */
  step: number;
}
