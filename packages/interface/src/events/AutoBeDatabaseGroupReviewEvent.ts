import { AutoBeDatabaseGroup } from "../histories/contents/AutoBeDatabaseGroup";
import { AutoBeDatabaseGroupRevise } from "../histories/contents/AutoBeDatabaseGroupRevise";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Database agent reviews and validates the component
 * group organization during the database design process.
 *
 * This event occurs after the initial group generation phase, where the
 * Database Group agent has organized business domains into logical component
 * groups. The review validates the group organization against business
 * requirements, checks for missing or redundant groups, verifies domain
 * boundaries, and ensures proper kind assignment.
 *
 * The review process ensures that the group structure provides a solid
 * foundation for subsequent component and authorization table generation
 * by identifying and correcting organizational issues before table extraction
 * begins.
 *
 * @author Michael
 */
export interface AutoBeDatabaseGroupReviewEvent
  extends AutoBeEventBase<"databaseGroupReview">,
    AutoBeAggregateEventBase {
  /**
   * Comprehensive review analysis of the group organization.
   *
   * Contains the AI agent's detailed evaluation of the group structure
   * including validation of domain completeness, group boundaries, naming
   * conventions, and kind assignments.
   *
   * **Review Dimensions:**
   *
   * - **Domain Completeness**: Verifies all business domains are covered
   * - **Group Boundaries**: Validates domain separation is appropriate
   * - **Kind Assignment**: Ensures exactly 1 authorization and ≥1 domain
   * - **Naming Conventions**: Verifies namespace PascalCase and filename format
   * - **Scope Balance**: Checks no group is too broad or too narrow
   */
  review: string;

  /**
   * Array of group revision operations applied during the review.
   *
   * Contains all create, update, and erase operations that were identified
   * and applied during the review process. Each operation includes a reason
   * explaining why the change was necessary.
   *
   * - **Create**: Groups added for missing business domains
   * - **Update**: Groups modified to fix naming, kind, or scope issues
   * - **Erase**: Groups removed because they are redundant or unnecessary
   */
  revises: AutoBeDatabaseGroupRevise[];

  /**
   * The reviewed groups with all revisions applied.
   *
   * Contains the complete list of component group skeletons after review,
   * with all revisions applied. Groups that were added, removed, or modified
   * are reflected in this final group structure used for subsequent
   * authorization and component table generation.
   */
  groups: AutoBeDatabaseGroup[];

  /**
   * Iteration number of the requirements analysis this group review was
   * performed for.
   */
  step: number;
}
