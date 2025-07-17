import { AutoBePrisma } from "../prisma/AutoBePrisma";
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
   * The target component specification that was assigned to the AI for schema
   * generation.
   *
   * Contains the {@link AutoBePrisma.IComponent} structure representing the
   * complete component definition that the AI was supposed to implement. Most
   * importantly, this includes the {@link AutoBePrisma.IComponent.tables} array
   * containing all table names that should have been generated as models for
   * this business domain.
   *
   * This component specification serves as the reference point for determining
   * which models are missing by comparing the expected tables list against the
   * actual models created. The component also provides the business namespace
   * and target filename context for the schema generation task.
   */
  component: AutoBePrisma.IComponent;

  /**
   * Array of models that were actually created by the AI function calling
   * process.
   *
   * Contains the {@link AutoBePrisma.IModel} objects representing the database
   * tables that were successfully generated during the schema creation process.
   * Each model includes complete field definitions, relationships, indexes, and
   * other schema elements that were properly implemented by the AI.
   *
   * This array represents the partial but valid schema output that was achieved
   * before the insufficient model generation was detected, providing the actual
   * state of what was accomplished versus what was expected.
   */
  actual: AutoBePrisma.IModel[];

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

  tablesToCreate: string[];
  validationReview: string;
  confirmedTables: string[];

  // /**
  //  * Array of other components whose domain boundaries may have been violated by
  //  * the AI-generated schema.
  //  *
  //  * Contains {@link AutoBePrisma.IComponent} objects representing other business
  //  * domains that may have been impacted by the AI function calling process
  //  * creating models outside of its assigned domain. This occurs when the AI
  //  * generates tables that belong to other components' business domains instead
  //  * of staying within the boundaries of its assigned component.
  //  *
  //  * Each component in this array contains only the tables that were
  //  * inappropriately created by the AI in its
  //  * {@link AutoBePrisma.IComponent.tables} array, not the complete set of tables
  //  * that belong to that component's domain. This filtered information helps
  //  * identify specific boundary violations and enables targeted corrective
  //  * actions.
  //  *
  //  * Domain invasions happen when AI creates tables that belong to other
  //  * components' domains, violating the domain-driven design principles and
  //  * potentially causing schema conflicts during deployment. This information
  //  * helps identify which domains were inappropriately invaded and enables
  //  * corrective actions to remove models that don't belong to the assigned
  //  * domain.
  //  */
  // invasions: AutoBePrisma.IComponent[];
}
