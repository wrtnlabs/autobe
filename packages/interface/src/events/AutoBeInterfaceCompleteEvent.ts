import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Interface agent completes the RESTful API design process
 * and generates the complete NestJS application.
 *
 * This event represents the successful completion of the sophisticated
 * multi-stage transformation pipeline that converts validated AST structures
 * into comprehensive API specifications and production-ready NestJS code. The
 * completion marks the transition from API design to implementation-ready
 * artifacts that maintain perfect alignment with business requirements and
 * database schemas.
 *
 * The Interface agent's completion ensures that API designs are syntactically
 * perfect and semantically aligned with business requirements, ready for
 * immediate deployment or further customization in the development workflow.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceCompleteEvent
  extends AutoBeEventBase<"interfaceComplete"> {
  /**
   * The complete OpenAPI document containing the finalized API specification.
   *
   * Contains the validated {@link AutoBeOpenApi.IDocument} AST structure that
   * defines all API endpoints, operations, schemas, and business logic. This
   * document represents the culmination of the API design process,
   * incorporating comprehensive business logic integration, type safety bridges
   * with Prisma schemas, and security pattern validation.
   *
   * The document serves as the authoritative API specification that has been
   * converted from the internal AST format to formal OpenAPI standards, ready
   * for code generation and integration with the broader development
   * ecosystem.
   */
  document: AutoBeOpenApi.IDocument;

  /**
   * Reason why the Interface agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Interface agent via function calling. This could include reasons such
   * as completing initial API design after database schema creation, updating
   * API specifications due to requirement changes, or regenerating interfaces
   * to reflect modified data models.
   *
   * Understanding the activation reason provides context for the API design
   * scope and helps stakeholders understand whether this represents new
   * development or refinement of existing API specifications.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis this API design was completed
   * for.
   *
   * Indicates which version of the requirements analysis this API design
   * reflects. If this value is lower than the current
   * {@link AutoBeAnalyzeCompleteEvent.step}, it means the API design may not
   * reflect the latest requirements and could need regeneration.
   *
   * The step value ensures proper synchronization between API specifications
   * and the underlying requirements, enabling stakeholders to understand the
   * currency of the API design relative to evolving project requirements.
   */
  step: number;
}
