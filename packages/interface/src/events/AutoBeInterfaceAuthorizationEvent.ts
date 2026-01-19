import { AutoBeOpenApi } from "../openapi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted during the API authorization and security design phase.
 *
 * This event is triggered when the Interface Agent is defining authorization
 * and security configurations for API operations. It represents the process of
 * establishing access control, authentication requirements, and security
 * policies for each API endpoint, ensuring that the generated backend
 * application implements proper security measures.
 *
 * The authorization phase transforms basic API endpoints into secure,
 * production-ready operations by adding authentication schemes, authorization
 * rules, and security headers. This critical step ensures that sensitive
 * business operations are properly protected and that the API adheres to
 * security best practices and compliance requirements.
 *
 * By extending multiple base interfaces, this event provides comprehensive
 * tracking capabilities including progress monitoring for batch operation
 * processing and token usage analytics for cost optimization.
 *
 * @author Michael
 */
export interface AutoBeInterfaceAuthorizationEvent
  extends AutoBeEventBase<"interfaceAuthorization">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Analysis of the actor's authentication requirements and schema context.
   *
   * Documents the agent's understanding of the actor type (guest/member/admin),
   * what authentication fields exist in the database schema, what additional
   * authentication features are supported by the schema, and what operations
   * are appropriate for this actor kind.
   */
  analysis: string;

  /**
   * Rationale for the authorization operation design decisions.
   *
   * Explains why specific operations were included or excluded, how the actor
   * kind influenced the essential operations selection (e.g., why guests don't
   * have login), what schema fields enabled additional operations, and why
   * certain authentication patterns were chosen.
   */
  rationale: string;

  /**
   * Array of API operations being defined for the endpoints.
   *
   * Contains the detailed {@link AutoBeOpenApi.IOperation} specifications that
   * define the business logic, parameters, responses, and behavior for each API
   * function. Each operation includes comprehensive documentation,
   * request/response schemas, error handling specifications, and security
   * requirements that transform basic endpoints into complete API contracts.
   *
   * The operations ensure that every API function has clear behavioral
   * definitions, proper validation rules, and comprehensive documentation that
   * enables accurate implementation and reliable client integration throughout
   * the application ecosystem.
   */
  operations: AutoBeOpenApi.IOperation[];

  /**
   * Iteration number of the requirements analysis this operation definition was
   * performed for.
   *
   * Indicates which version of the requirements analysis this operation design
   * reflects. This step number ensures that the API operations are aligned with
   * the current requirements and helps track the evolution of API functionality
   * as business requirements change.
   *
   * The step value enables proper synchronization between operation definitions
   * and the underlying requirements, ensuring that the API behavior remains
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
