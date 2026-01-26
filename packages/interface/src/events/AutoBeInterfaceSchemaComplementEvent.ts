import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Interface agent supplements missing types and schemas
 * during the API specification process.
 *
 * This event occurs when the Interface agent identifies that additional type
 * definitions or schema components are needed to complete the API
 * specification. The complement phase ensures that all necessary types used in
 * API operations are properly defined, including nested objects, utility types,
 * and supporting data structures that may have been initially overlooked.
 *
 * The complement process is essential for creating complete and self-contained
 * OpenAPI specifications that can generate fully functional NestJS applications
 * without missing dependencies or incomplete type definitions.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaComplementEvent
  extends
    AutoBeEventBase<"interfaceSchemaComplement">,
    AutoBeAggregateEventBase,
    AutoBeProgressEventBase {
  /**
   * Type name of the schema being created.
   *
   * Specifies the specific DTO type name that is being generated to fill the
   * gap. This will be the same as the `missed` field.
   */
  typeName: string;

  /**
   * Analysis of the missing type's purpose and context.
   *
   * Documents the agent's understanding of why this type is referenced, where
   * it is referenced from ($ref locations), what the reference context reveals
   * about expected structure, and similar types that provide structural hints.
   */
  analysis: string;

  /**
   * Rationale for the schema design decisions.
   *
   * Explains why the schema was designed with specific properties, required vs
   * optional field choices, how it satisfies referencing schemas' expectations,
   * and what patterns from existing schemas were followed.
   */
  rationale: string;

  /**
   * Additional schema definition being added to complement the API
   * specification.
   *
   * Contains the newly created schema definition that fills the gap identified
   * as the missing type. The schema contains the complete
   * {@link AutoBeOpenApi.IJsonSchemaDescriptive} definition with proper typing,
   * validation rules, and descriptive documentation.
   *
   * This complementary schema ensures that the type referenced throughout the
   * API specification is properly defined, enabling successful code generation
   * and maintaining type safety across the entire application.
   */
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Iteration number of the requirements analysis this API complement was
   * performed for.
   *
   * Indicates which version of the requirements analysis this schema complement
   * activity reflects. This step number ensures that the complementary types
   * are aligned with the current requirements and helps track the evolution of
   * the API specification as requirements change.
   *
   * The step value enables proper synchronization between the API design and
   * the underlying requirements, ensuring that schema additions remain relevant
   * to the current project scope and objectives.
   */
  step: number;
}
