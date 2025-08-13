import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

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
export interface AutoBeInterfaceComplementEvent
  extends AutoBeEventBase<"interfaceComplement"> {
  /**
   * Array of missing schema names that were identified and need to be defined.
   *
   * Contains the list of type or schema names that were referenced in API
   * operations but were not previously defined in the components section. These
   * missing definitions could include nested data transfer objects, utility
   * types, enumeration definitions, or supporting data structures that are
   * required for complete API functionality.
   *
   * Identifying and tracking these missing schemas ensures that the final
   * OpenAPI specification is complete and self-contained, preventing
   * compilation errors in the generated code.
   */
  missed: string[];

  /**
   * Additional schema definitions being added to complement the API
   * specification.
   *
   * Contains the newly created schema definitions that fill the gaps identified
   * in the missed array. Each key represents the schema name and each value
   * contains the complete {@link AutoBeOpenApi.IJsonSchemaDescriptive}
   * definition with proper typing, validation rules, and descriptive
   * documentation.
   *
   * These complementary schemas ensure that all types referenced throughout the
   * API specification are properly defined, enabling successful code generation
   * and maintaining type safety across the entire application.
   */
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

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

  /**
   * Token usage statistics for the schema complement identification and
   * generation process.
   *
   * Captures the computational resources consumed by the Interface agent when
   * analyzing the API specification to identify missing type definitions and
   * generating the necessary complementary schemas. This metric reflects the
   * effort required to ensure API completeness by discovering dependency gaps
   * and creating appropriate type definitions.
   *
   * The token usage varies with the number of missing schemas identified and
   * their complexity, including nested structures, utility types, enumerations,
   * and supporting data structures needed for a self-contained specification.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
