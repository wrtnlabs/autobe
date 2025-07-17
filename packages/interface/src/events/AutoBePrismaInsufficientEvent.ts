import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent creates fewer models than expected during
 * the database schema creation process.
 *
 * This event occurs when the AI function calling process results in an
 * incomplete set of models for a specific business domain or functional
 * category. The event indicates that the schema generation did not meet the
 * expected model count, which may require additional iterations or manual
 * intervention to complete the database design.
 *
 * This insufficient model creation can happen due to various reasons such as
 * incomplete AI responses, context limitations, or partial understanding of the
 * business requirements. The event provides detailed information about the gap
 * between expected and actual model creation to enable appropriate corrective
 * actions.
 *
 * @author Samchon
 */
export interface AutoBePrismaInsufficientEvent
  extends AutoBeEventBase<"prismaInsufficient"> {
  /**
   * The completed schema file containing the successfully generated models.
   *
   * Contains the {@link AutoBePrisma.IFile} structure representing a partial but
   * valid schema file with the models that were actually created by the AI
   * function calling process. The file includes the filename following the
   * `schema-{number}-{domain}.prisma` convention, the business namespace, and
   * all successfully created models with their fields, indexes, and
   * relationships.
   *
   * This file represents what was successfully completed before the
   * insufficient model generation was detected, providing a complete picture of
   * the partial schema state and serving as the foundation for completing the
   * missing models.
   */
  completed: AutoBePrisma.IFile;

  /**
   * Array of model names that should have been created for this domain.
   *
   * Contains the names of all models that were identified in the requirements
   * analysis and component organization for this specific business domain. This
   * represents the complete set of models that the AI function calling process
   * was supposed to generate based on the business requirements.
   *
   * This list serves as the reference point for determining which models are
   * missing and provides context for the scope of the database design task.
   */
  expected: string[];

  /**
   * Array of model names that were not created by the AI function calling.
   *
   * Contains the names of models that were identified in the requirements
   * analysis but were not generated during the schema creation process. This
   * information helps identify specific missing entities and enables targeted
   * corrective actions to complete the schema design.
   *
   * The missing models represent the gap between what was planned and what was
   * actually delivered by the AI function calling process.
   */
  missed: string[];
}
