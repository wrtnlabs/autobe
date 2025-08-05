import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceComplementApplication {
  /**
   * Complements missing schema types
   *
   * This method fills in schema definitions that are referenced via $ref but
   * not yet defined in the `components.schemas` section. For example, if an API
   * operation references `{ "$ref": "#/components/schemas/UserProfile" }` but
   * `UserProfile` type is not defined in `components.schemas`, this method will
   * add the missing schema definition.
   *
   * This function is designed to be called via AI function calling mechanism to
   * ensure the OpenAPI document is complete and all referenced schemas are
   * properly defined.
   */
  complementComponents(
    props: IAutoBeInterfaceComplementApplication.IProps,
  ): void;
}
export namespace IAutoBeInterfaceComplementApplication {
  export interface IProps {
    /**
     * Step 1: Strategic missing schema analysis and planning.
     *
     * AI analyzes the OpenAPI document to identify all missing schema references
     * and formulates a comprehensive completion strategy. This planning phase is
     * crucial for understanding the full dependency chain of missing schemas,
     * including nested references that may emerge when creating new schemas.
     * The AI must trace all $ref paths and plan for recursive completion.
     *
     * **Key Considerations:**
     *
     * - **Reference Scanning**: Find all $ref pointing to undefined schemas
     * - **Dependency Analysis**: Map schema dependencies and reference chains
     * - **Type Inference**: Plan schema structures based on usage context
     * - **Nested References**: Anticipate new $refs in generated schemas
     * - **Completion Strategy**: Plan iterative approach for full coverage
     * - **Naming Patterns**: Understand type naming conventions in use
     *
     * Workflow: Reference scanning → Dependency mapping → Completion planning
     */
    thinking: string;

    /**
     * Step 2: Initial missing schema definitions.
     *
     * AI generates the first working version of missing schema definitions based
     * on the analysis. This draft must include complete JSON Schema definitions
     * for all identified missing types, with appropriate properties, types, and
     * validation rules inferred from context. The definitions should follow
     * existing patterns in the OpenAPI document.
     *
     * **Implementation Requirements:**
     *
     * - **Complete Definitions**: Full JSON Schema for each missing type
     * - **Type Inference**: Appropriate types based on naming and usage
     * - **Property Structure**: Logical properties based on context
     * - **Required Fields**: Reasonable required arrays
     * - **Descriptions**: Clear explanations for schemas and properties
     * - **Format Specifications**: email, uuid, datetime where appropriate
     * - **Nested References**: May introduce new $refs to be resolved
     *
     * **Schema Patterns:**
     *
     * - Object types with logical property sets
     * - Arrays with proper item definitions
     * - Enums with meaningful values
     * - Primitive types with constraints
     *
     * Workflow: Missing schemas → Type inference → Schema generation
     */
    draft: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

    /**
     * Step 3: Schema complement review and dependency check.
     *
     * AI performs a thorough review of the draft schema definitions, checking
     * for quality, completeness, and identifying any new missing dependencies
     * introduced by the generated schemas. This review ensures all schemas
     * are properly defined and the dependency chain is fully resolved.
     *
     * **Review Dimensions:**
     *
     * **Schema Quality (Per INTERFACE_COMPLEMENT.md):**
     *
     * - Valid JSON Schema syntax and structure
     * - Appropriate type choices and formats
     * - Logical property organization
     * - Reasonable validation constraints
     *
     * **Dependency Resolution:**
     *
     * - Check draft schemas for new $ref references
     * - Identify any newly introduced missing schemas
     * - Verify complete dependency chain coverage
     * - Plan additional schemas if needed
     *
     * **Description Quality:**
     *
     * - Clear, detailed schema descriptions
     * - Comprehensive property explanations
     * - Business context and usage notes
     * - Examples where helpful
     *
     * **Consistency Check:**
     *
     * - Alignment with existing schema patterns
     * - Naming convention adherence
     * - Type usage consistency
     * - Format specification alignment
     *
     * **Language Validation:**
     *
     * - ALL descriptions MUST be in English
     * - Check for non-English content
     * - Identify mixed-language descriptions
     *
     * Workflow: Draft review → Dependency check → Quality assessment
     */
    review: string;

    /**
     * Step 4: Final complete schema complement.
     *
     * AI produces the final version of missing schema definitions, incorporating
     * all review feedback and ensuring complete dependency resolution. This
     * final set includes all originally missing schemas plus any additional
     * schemas discovered during the dependency analysis. All schemas must be
     * production-ready with comprehensive documentation.
     *
     * **Final Schema Characteristics:**
     *
     * - **Complete Resolution**: ALL missing schemas defined
     * - **Dependency Closure**: No unresolved $ref references
     * - **Quality Standards**: Valid, well-structured JSON Schemas
     * - **Rich Documentation**: Detailed English descriptions throughout
     * - **Consistency**: Follows document's existing patterns
     * - **Type Accuracy**: Appropriate types and formats
     * - **Validation Rules**: Reasonable constraints applied
     *
     * **Quality Requirements (Per INTERFACE_COMPLEMENT.md):**
     *
     * - Type inference based on context and usage
     * - Property requirements based on patterns
     * - Format specifications where evident
     * - Nested reference handling
     * - Comprehensive descriptions explaining:
     *   - What the schema represents
     *   - Purpose and usage context
     *   - Business logic or constraints
     *   - Valid value examples
     *   - Entity relationships
     *
     * **Language Requirements:**
     *
     * - If review found non-English content, translate to English
     * - Maintain clarity and technical accuracy
     * - Preserve detailed explanations
     *
     * Example structure:
     * ```typescript
     * {
     *   "UserProfile": {
     *     "type": "object",
     *     "properties": {
     *       "id": { "type": "string", "format": "uuid" },
     *       "displayName": { "type": "string" },
     *       "avatar": { "$ref": "#/components/schemas/Avatar" }
     *     },
     *     "required": ["id", "displayName"],
     *     "description": "User profile information..."
     *   },
     *   "Avatar": {
     *     // Additional schema discovered during dependency analysis
     *   }
     * }
     * ```
     *
     * Workflow: Review feedback → Dependency completion → Language correction → Final schemas
     *
     * This complement ensures the OpenAPI document has complete schema coverage.
     */
    final: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }
}
