import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

/**
 * Function calling interface for planning transformer DTO generation.
 *
 * Guides the AI agent through analyzing a single DTO type and determining
 * whether it needs a transformer. Each DTO is analyzed independently, enabling
 * parallel processing across all DTOs.
 *
 * The planning follows a structured RAG workflow: preliminary context gathering
 * (database schemas, DTO schemas) → eligibility analysis → plan generation.
 *
 * **Key Decisions**: Not all DTOs require transformers. The agent must
 * distinguish transformable DTOs (Read DTO + DB-backed + Direct mapping) from
 * non-transformable DTOs (request params, pagination wrappers, business logic
 * types) and set databaseSchemaName to null for non-transformable ones.
 */
export interface IAutoBeRealizeTransformerPlanApplication {
  /**
   * Process transformer planning task or preliminary data requests.
   *
   * Analyzes the given DTO type and generates a plan entry determining whether
   * a transformer is needed. Returns exactly ONE plan entry for the given DTO.
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
     * - Is this DTO transformable or non-transformable?
     * - What database table does it map to (if transformable)?
     * - Why is it non-transformable (if applicable)?
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
   * Generates a plan with exactly ONE entry for the given DTO, indicating
   * whether it is transformable (has database schema name) or non-transformable
   * (null).
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Plan entry for the given DTO.
     *
     * Must contain exactly ONE entry with:
     *
     * - DTO type name matching the given DTO
     * - Chain of thought explaining the analysis
     * - Database schema name if transformable, or null if not
     *
     * Use databaseSchemaName to distinguish:
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
