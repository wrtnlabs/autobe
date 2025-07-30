import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

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
export interface AutoBeInterfaceSchemasEvent
  extends AutoBeEventBase<"interfaceSchemas"> {
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
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Number of schema definitions that have been completed so far.
   *
   * Indicates the current progress in the schema definition process, showing
   * how many schema definitions have been successfully created and validated.
   * This progress tracking helps stakeholders understand the advancement of the
   * API specification development and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of schema definitions that need to be defined.
   *
   * Represents the complete scope of schema definitions required for the API
   * specification. This total count provides context for the completion
   * progress and helps stakeholders understand the overall complexity and scope
   * of the API being designed.
   */
  total: number;

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
