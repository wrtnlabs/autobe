import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

/**
 * Function calling interface for planning transformer DTO generation.
 *
 * Guides the AI agent through analyzing operation requirements and determining
 * which transformer DTOs must be generated before the REALIZE_TRANSFORMER_WRITE
 * phase. Solves the dependency problem by ensuring all transformers that import
 * other transformers are identified upfront.
 *
 * The planning follows a structured RAG workflow: preliminary context gathering
 * (database schemas, DTO schemas) → eligibility analysis → plan generation.
 *
 * **Key Decisions**: Not all DTOs require transformers. The agent must
 * distinguish transformable DTOs (Read DTO + DB-backed + Direct mapping) from
 * non-transformable DTOs (request params, pagination wrappers, business logic
 * types) and include ALL DTOs with databaseSchemaName set to null for
 * non-transformable ones.
 */
export interface IAutoBeRealizeTransformerPlanApplication {
  /**
   * Process transformer planning task or preliminary data requests.
   *
   * Analyzes operation response DTOs and generates complete plan listing which
   * transformers to generate. Ensures nested DTOs are analyzed recursively and
   * ALL DTOs are included with appropriate databaseSchemaName values.
   *
   * @param props Request containing either preliminary data request or complete
   *   plan
   */
  process(props: IAutoBeRealizeTransformerPlanApplication.IProps): void;
}
export namespace IAutoBeRealizeTransformerPlanApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your plan, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What schemas (database or DTO) are missing that you need?
     * - Why do you need them for planning?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion:
     *
     * - How many DTOs are transformable vs non-transformable?
     * - Why were certain DTOs excluded (pagination wrappers, request params,
     *   business logic)?
     * - Are nested DTOs analyzed recursively?
     * - Summarize - don't enumerate every DTO.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - "getDatabaseSchemas": Retrieve database table schemas for DB structure
     * - "getInterfaceSchemas": Retrieve DTO type definitions for API contracts
     * - "complete": Generate final transformer plan
     *
     * The preliminary types are removed from the union after their respective
     * data has been provided, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to complete transformer planning.
   *
   * Generates comprehensive plan listing ALL DTOs analyzed, including both
   * transformable and non-transformable DTOs. Transformable DTOs have a
   * database schema name, while non-transformable DTOs have null.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Complete list of DTOs analyzed for transformer generation.
     *
     * Each plan entry specifies one DTO with:
     *
     * - DTO type name analyzed
     * - Chain of thought explaining the analysis
     * - Database schema name if transformable, or null if not
     *
     * Include ALL DTOs from the operation response, both transformable and
     * non-transformable. Use databaseSchemaName to distinguish:
     *
     * - Non-null: Transformable DTO, transformer will be generated
     * - Null: Non-transformable DTO, no transformer needed
     */
    plans: IPlan[];
  }

  /**
   * Plan for a single DTO analysis result.
   *
   * Records the planning decision for one DTO from the operation response.
   */
  export interface IPlan {
    /**
     * DTO type name being analyzed.
     *
     * The TypeScript interface type from the operation response.
     *
     * Example: "IShoppingSaleUnitStock", "IShoppingCategory", "IPage.IRequest"
     */
    dtoTypeName: string;

    /**
     * Chain of thought for this DTO's planning decision.
     *
     * Explains the agent's reasoning:
     *
     * - For transformable DTOs: Why a transformer is needed, which database table
     *   it maps to
     * - For non-transformable DTOs: Why no transformer is needed (request param,
     *   pagination wrapper, business logic, etc.)
     *
     * Example (transformable): "Transforms shopping_sales to IShoppingSale with
     * nested category and tags"
     *
     * Example (non-transformable): "IPage.IRequest is pagination parameter, not
     * database-backed"
     */
    thinking: string;

    /**
     * Database schema name if transformable, null if not.
     *
     * - **Non-null**: The database table name this DTO maps to. A transformer
     *   will be generated for this DTO.
     * - **Null**: This DTO is non-transformable (request param, pagination
     *   wrapper, business logic type). No transformer will be generated.
     *
     * Example (transformable): "shopping_sales", "shopping_categories" Example
     * (non-transformable): null
     */
    databaseSchemaName: string | null;
  }
}
