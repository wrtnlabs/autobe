import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaApplication {
  /**
   * Generate OpenAPI components containing named schema types.
   *
   * This method receives a complete set of schema components and integrates
   * them into the final OpenAPI specification. It processes all entity schemas,
   * their variants, and related type definitions to ensure a comprehensive and
   * consistent API design.
   *
   * The provided components should include schemas for all entities identified
   * in the previous phases of API path/method definition and operation
   * creation. This ensures that the final OpenAPI document has complete type
   * coverage for all operations.
   *
   * CRITICAL: All schema definitions must follow the established naming
   * conventions (IEntityName, IEntityName.ICreate, etc.) and must be thoroughly
   * documented with descriptions that reference the original Prisma schema
   * comments.
   *
   * @param props Properties containing components to generate.
   */
  makeComponents(props: IAutoBeInterfaceSchemaApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaApplication {
  export interface IProps {
    /**
     * Step 1: Strategic schema design analysis and planning.
     *
     * AI analyzes the API operations, Prisma schemas, and ERD diagrams to
     * formulate a comprehensive schema definition strategy. This planning phase
     * is crucial for ensuring complete type coverage and consistency across
     * the API specification. The AI must identify all entities, their variants,
     * relationships, and security considerations before implementation.
     *
     * **Key Considerations:**
     *
     * - **Entity Inventory**: Extract ALL entities from Prisma schema and operations
     * - **Type Variants**: Plan .ICreate, .IUpdate, .ISummary, .IRequest variants
     * - **Security Planning**: Identify sensitive fields to exclude from responses
     * - **Authentication Fields**: Plan which fields come from auth context
     * - **Relationship Mapping**: Design nested objects and references
     * - **Naming Strategy**: Ensure consistent type naming with service prefix
     *
     * Workflow: Operation analysis → Entity extraction → Security planning → Schema design
     */
    thinking: string;

    /**
     * Step 2: Initial schema definitions implementation.
     *
     * AI generates the first working version of OpenAPI schema definitions based
     * on the strategic plan. This draft must be a complete Record of schema
     * objects that implements ALL entities from the Prisma schema with their
     * variants. Every entity must have appropriate type definitions following
     * OpenAPI JSON Schema standards.
     *
     * **Implementation Requirements:**
     *
     * - **Complete Coverage**: Every Prisma entity as named schema type
     * - **Type Variants**: .ICreate, .IUpdate, .ISummary, .IRequest as needed
     * - **Property Mapping**: All Prisma fields with correct types/formats
     * - **Required Arrays**: Accurate required field specifications
     * - **Descriptions**: Multi-paragraph details from Prisma comments
     * - **Named References**: ALL objects use $ref, NO inline definitions
     * - **Standard Types**: IPage, IPagination for paginated responses
     *
     * **Security Implementation:**
     *
     * - Response types: NO passwords, tokens, or sensitive fields
     * - Request types: NO actor IDs (user_id, creator_id, author_id)
     * - Authentication fields handled by decorators, not requests
     *
     * Workflow: Strategic plan → Schema implementation → Complete type definitions
     */
    draft: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

    /**
     * Step 3: Schema definitions review and quality assessment.
     *
     * AI performs a thorough review of the draft schema implementation,
     * examining multiple quality dimensions to ensure production readiness.
     * This review validates completeness, security, and compliance with
     * OpenAPI standards and project conventions.
     *
     * **Review Dimensions:**
     *
     * **Completeness Validation:**
     *
     * - All Prisma entities have schema definitions
     * - All operations' type references exist
     * - Required variants (.ICreate, etc.) are present
     * - No missing properties from Prisma schema
     *
     * **Security Audit (Per INTERFACE_SCHEMA.md):**
     *
     * - Response types exclude ALL sensitive fields:
     *   - No password/hash fields
     *   - No tokens or API keys
     *   - No internal system fields
     * - Request types exclude ALL actor identification:
     *   - No user_id, creator_id, author_id
     *   - No ownership assignment fields
     *   - Authentication comes from decorators only
     *
     * **Type Reference Validation:**
     *
     * - ALL objects use $ref to named types
     * - NO inline/anonymous object definitions
     * - Proper #/components/schemas/ paths
     * - Arrays of objects properly reference types
     *
     * **Description Quality:**
     *
     * - Multi-paragraph schema descriptions
     * - Property descriptions from Prisma comments
     * - Business context and relationships explained
     * - Examples provided where helpful
     *
     * **Language Validation:**
     *
     * - ALL descriptions MUST be in English
     * - Check for non-English content
     * - Identify mixed-language descriptions
     *
     * Workflow: Draft schemas → Security audit → Reference validation → Quality assessment
     */
    review: string;

    /**
     * Step 4: Final production-ready schema definitions.
     *
     * AI produces the final, polished version of schema definitions incorporating
     * all review feedback. This Record of schemas represents the complete type
     * system for the API, ready for integration with operations. All identified
     * issues must be resolved, and schemas must meet enterprise standards.
     *
     * **Final Schema Characteristics:**
     *
     * - **100% Entity Coverage**: ALL Prisma entities with ALL properties
     * - **Complete Variants**: All necessary .ICreate, .IUpdate, etc.
     * - **Security Compliance**: NO sensitive fields in responses
     * - **Authentication Safety**: NO actor IDs in requests
     * - **Named Types Only**: ALL objects defined and referenced by name
     * - **Rich Documentation**: Comprehensive English descriptions
     * - **Type Accuracy**: Proper formats (uuid, email, datetime, etc.)
     * - **Relationship Integrity**: Correct references between entities
     *
     * **Critical Requirements (Per INTERFACE_SCHEMA.md):**
     *
     * - Main entity types (IEntityName format)
     * - Operation variants with appropriate fields
     * - Container types (IPage with standard structure)
     * - Enumeration types from Prisma schema
     * - Multi-paragraph descriptions throughout
     * - Property descriptions from column comments
     * - English-only content (translate if needed)
     *
     * **Language Requirements:**
     *
     * - If review found non-English content, translate to English
     * - Preserve technical accuracy in translation
     * - Maintain multi-paragraph structure
     *
     * Example structure:
     * ```typescript
     * {
     *   IUser: {
     *     type: "object",
     *     properties: {
     *       id: { type: "string", format: "uuid" },
     *       email: { type: "string", format: "email" },
     *       profile: { "$ref": "#/components/schemas/IUserProfile" }
     *       // NO password, NO tokens
     *     },
     *     required: ["id", "email"],
     *     description: "User entity representing..."
     *   },
     *   "IUser.ICreate": {
     *     // NO user_id, NO creator_id
     *   }
     * }
     * ```
     *
     * Workflow: Review feedback → Issue resolution → Language translation → Production schemas
     *
     * This schema set serves as the complete type system for the API specification.
     */
    final: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }
}
