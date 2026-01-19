import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Interface agent defines schema definitions during the
 * API specification process.
 *
 * This event occurs when the Interface agent is creating the reusable schema
 * definitions that will be used throughout the API specification. Schema
 * definitions include data transfer objects (DTOs), request/response schemas,
 * and other type definitions that provide the structural foundation for API
 * operations and ensure type safety across the entire application.
 *
 * The schema creation process ensures that all data structures used in API
 * operations are properly defined, validated, and documented, enabling
 * consistent data handling and robust type checking throughout the generated
 * application.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaEvent
  extends
    AutoBeEventBase<"interfaceSchema">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Type name of the schema being defined.
   *
   * Represents the unique identifier for the schema definition being created in
   * the OpenAPI specification. This type name will be used as the key in the
   * OpenAPI components.schemas object and referenced throughout the API
   * specification for type consistency and reusability.
   *
   * The type name follows TypeScript naming conventions and should be
   * descriptive of the data structure it represents, enabling clear
   * understanding of the schema's purpose in the API contract.
   */
  typeName: string;

  /**
   * Analysis of the type's purpose and context.
   *
   * Documents the agent's understanding of the schema before designing it,
   * including the type's purpose, related database entities or operations,
   * expected fields based on variant type, and structural hints from related
   * types.
   */
  analysis: string;

  /**
   * Rationale for the schema design decisions.
   *
   * Explains why the schema was designed with specific properties, required vs
   * optional field choices, $ref usage decisions, and what was excluded (e.g.,
   * auto-generated fields for ICreate variants).
   */
  rationale: string;

  /**
   * Schema definitions being defined for the API specification.
   *
   * Contains the schema record that defines reusable schema definitions for the
   * OpenAPI specification. These schemas serve as the building blocks for API
   * operations, providing consistent type definitions and ensuring that data
   * structures are properly validated and documented.
   *
   * The schemas maintain perfect alignment with the database schema while
   * providing the appropriate level of abstraction for API consumers, including
   * proper validation rules, descriptive documentation, and type safety
   * throughout the application stack.
   */
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Iteration number of the requirements analysis this schema creation was
   * performed for.
   *
   * Indicates which version of the requirements analysis this schema design
   * reflects. This step number ensures that the schema definitions are aligned
   * with the current requirements and helps track the evolution of data
   * structures as requirements change.
   *
   * The step value enables proper synchronization between schema definitions
   * and the underlying requirements, ensuring that the API schemas remain
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
