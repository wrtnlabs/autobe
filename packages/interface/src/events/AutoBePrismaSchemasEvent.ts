import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent completes the design of tables within a
 * specific category group during the database schema creation process.
 *
 * This event occurs each time the Prisma agent finishes designing all tables
 * that belong to a particular business domain or functional category. The
 * schema creation follows the organized component structure, systematically
 * developing related tables while maintaining proper dependencies and
 * relationships across the database design.
 *
 * The incremental schema completion provides visibility into the database
 * design progress and ensures that each domain's data models are thoroughly
 * developed before proceeding to the next functional area.
 *
 * @author Samchon
 */
export interface AutoBePrismaSchemasEvent
  extends AutoBeEventBase<"prismaSchemas"> {
  /**
   * The completed schema file containing models for a specific business domain.
   *
   * Contains the {@link AutoBePrisma.IFile} structure representing a complete
   * schema file with all its models, relationships, and constraints designed
   * for a particular business domain. The file includes the filename following
   * the `schema-{number}-{domain}.prisma` convention, the business namespace,
   * and all related models with their fields, indexes, and relationships.
   *
   * Each file represents a cohesive unit of database design focused on a
   * specific business area, ensuring logical organization and maintainable
   * schema structure that follows domain-driven design principles.
   */
  file: AutoBePrisma.IFile;

  /**
   * Number of schema files that have been completed so far.
   *
   * Indicates the current progress in the schema design process, showing how
   * many business domain schema files have been successfully created and
   * validated. This progress tracking helps stakeholders understand the
   * advancement of database design and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of schema files that need to be created.
   *
   * Represents the complete scope of schema files required for the database
   * design, corresponding to the number of business domains identified during
   * the component organization phase. This total count provides context for the
   * completion progress and helps stakeholders understand the overall
   * complexity and scope of the database architecture.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this schema creation was
   * performed for.
   *
   * Indicates which version of the requirements analysis this schema design
   * reflects. This step number ensures that the database schemas are aligned
   * with the current requirements and helps track the evolution of data models
   * as business requirements change.
   *
   * The step value enables proper synchronization between schema development
   * and the underlying requirements, ensuring that the database structure
   * remains relevant to the current project scope and business objectives.
   */
  step: number;
}
