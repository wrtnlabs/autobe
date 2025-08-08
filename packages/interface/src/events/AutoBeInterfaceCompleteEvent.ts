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

  /**
   * Elapsed time in milliseconds for the entire API design process.
   *
   * Indicates the total time taken to complete the API design process from the
   * start of requirements analysis through to the final API specification
   * generation. This metric helps in understanding the efficiency of the API
   * design phase and can be used for process improvement analysis.
   *
   * This elapsed time includes all stages of the API design process, from
   * initial requirements gathering, through business logic integration, to the
   * final generation of the OpenAPI document. It serves as a performance
   * indicator for the Interface agent's design capabilities and the overall
   * efficiency of the API design workflow.
   */
  elapsed: number;
}
