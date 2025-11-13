import { AutoBePrisma } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBePrismaReviewApplication {
  /**
   * Process schema review task or preliminary data requests.
   *
   * Reviews generated Prisma models to validate normalization, relationships,
   * indexes, and business alignment, producing necessary modifications.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBePrismaReviewApplication.IProps): void;
}
export namespace IAutoBePrismaReviewApplication {
  export interface IProps {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas) or final schema review (complete).
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas;
  }

  /**
   * Request to review and refine Prisma schema models.
   *
   * Executes comprehensive schema review to validate design quality and
   * identify necessary improvements for normalization, relationships, and
   * performance optimization.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Comprehensive review analysis of the schema.
     *
     * Contains detailed evaluation of the schema design including:
     *
     * - Normalization validation: Confirms 3NF compliance and proper data
     *   structure
     * - Relationship integrity: Validates foreign key references and cardinality
     * - Performance optimization: Reviews indexing strategy and query patterns
     * - Business logic alignment: Ensures schema supports all use cases
     * - Naming conventions: Verifies consistent naming patterns
     * - Data type consistency: Confirms appropriate field types
     * - Temporal field handling: Validates audit trail implementation
     *
     * The review identifies potential issues and confirms adherence to best
     * practices before final implementation.
     */
    review: string;

    /**
     * Strategic database design plan.
     *
     * Contains the original planning document outlining the database
     * architecture strategy including table structures, relationships,
     * normalization approach, and business requirement mapping. This plan
     * serves as the blueprint for validating the implemented schema.
     *
     * Planning components:
     *
     * - Business requirements: Mapping of business needs to database structures
     * - Table design: Entity definitions and attribute specifications
     * - Relationship strategy: Cardinality and referential integrity planning
     * - Normalization approach: Application of 1NF, 2NF, 3NF principles
     * - Performance considerations: Index strategy and query optimization
     * - Snapshot architecture: Temporal data handling and audit requirements
     * - Materialized views: Denormalization strategy for performance
     */
    plan: string;

    /**
     * Modified Prisma models based on review feedback.
     *
     * Contains ONLY the models that required changes, not the entire schema.
     * Each model is a complete table definition with all fields, relationships,
     * indexes, and documentation. These modifications merge with the original
     * schema to produce the final implementation.
     *
     * Model requirements:
     *
     * - Complete models: Each entry must be a complete model definition
     * - Targeted changes: Only includes models that need modifications
     * - AST compliance: Follows AutoBePrisma.IModel interface structure
     * - Relationship integrity: All foreign keys reference valid models
     * - Index optimization: Strategic indexes without redundancy
     * - Documentation: Comprehensive English descriptions
     *
     * Models not included remain unchanged from the original schema. All
     * modifications must resolve issues identified in the review.
     */
    modifications: AutoBePrisma.IModel[];
  }
}
