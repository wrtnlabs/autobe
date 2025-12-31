import { AutoBeRealizeCollectorReference } from "@autobe/interface";

import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

/**
 * Function calling interface for planning collector DTO generation.
 *
 * Guides the AI agent through analyzing operation requirements and determining
 * which collector DTOs must be generated before the REALIZE_COLLECTOR_WRITE
 * phase. Solves the dependency problem by ensuring all collectors that import
 * other collectors are identified upfront.
 *
 * The planning follows a structured RAG workflow: preliminary context gathering
 * (database schemas, DTO schemas, Operations) → eligibility analysis → plan
 * generation.
 *
 * **Key Decisions**: Not all DTOs require collectors. The agent must
 * distinguish collectable DTOs (Create DTO + DB-backed + Direct mapping) from
 * non-collectable DTOs (read-only DTOs, computed types) and include ALL DTOs
 * with databaseSchemaName set to null for non-collectable ones.
 */
export interface IAutoBeRealizeCollectorPlanApplication {
  /**
   * Process collector planning task or preliminary data requests.
   *
   * Analyzes operation request DTOs and generates complete plan listing which
   * collectors to generate. Ensures nested DTOs are analyzed recursively and
   * ALL DTOs are included with appropriate databaseSchemaName values.
   *
   * @param props Request containing either preliminary data request or complete
   *   plan
   */
  process(props: IAutoBeRealizeCollectorPlanApplication.IProps): void;
}
export namespace IAutoBeRealizeCollectorPlanApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your plan, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What schemas (database, DTO, Operations) are missing that you need?
     * - Why do you need them for planning?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion:
     *
     * - How many DTOs are collectable vs non-collectable?
     * - Why were certain DTOs excluded (read-only, computed types)?
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
     * - "getInterfaceOperations": Retrieve operation specifications
     * - "getInterfaceSchemas": Retrieve DTO type definitions for API contracts
     * - "complete": Generate final collector plan
     *
     * The preliminary types are removed from the union after their respective
     * data has been provided, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to complete collector planning.
   *
   * Generates comprehensive plan listing ALL DTOs analyzed, including both
   * collectable and non-collectable DTOs. Collectable DTOs have a database
   * schema name, while non-collectable DTOs have null.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Complete list of DTOs analyzed for collector generation.
     *
     * Each plan entry specifies one DTO with:
     *
     * - DTO type name analyzed
     * - Chain of thought explaining the analysis
     * - Database schema name if collectable, or null if not
     *
     * Include ALL DTOs from the operation request, both collectable and
     * non-collectable. Use databaseSchemaName to distinguish:
     *
     * - Non-null: Collectable DTO, collector will be generated
     * - Null: Non-collectable DTO, no collector needed
     */
    plans: IPlan[];
  }

  /**
   * Plan for a single DTO analysis result.
   *
   * Records the planning decision for one DTO from the operation request.
   */
  export interface IPlan {
    /**
     * DTO type name being analyzed.
     *
     * The TypeScript interface type from the operation request body.
     *
     * Example: "IShoppingSale.ICreate", "IShoppingCategory.ICreate"
     */
    dtoTypeName: string;

    /**
     * Chain of thought for this DTO's planning decision.
     *
     * Explains the agent's reasoning:
     *
     * - For collectable DTOs: Why a collector is needed, which database table it
     *   maps to
     * - For non-collectable DTOs: Why no collector is needed (read-only DTO,
     *   computed type, etc.)
     *
     * Example (collectable): "Collects IShoppingSale.ICreate to shopping_sales
     * with nested category"
     *
     * Example (non-collectable): "IShoppingSale is read-only response DTO, not
     * for creation"
     */
    thinking: string;

    /**
     * Database schema name if collectable, null if not.
     *
     * - **Non-null**: The database table name this DTO maps to. A collector will
     *   be generated for this DTO.
     * - **Null**: This DTO is non-collectable (read-only DTO, computed type). No
     *   collector will be generated.
     *
     * Examples:
     *
     * - (collectable): "shopping_sales", "shopping_categories"
     * - (non-collectable): null
     */
    databaseSchemaName: string | null;

    /**
     * Referenced entities from path parameters or auth context.
     *
     * Each reference contains:
     *
     * - `databaseSchemaName`: Database table name (e.g., "shopping_sales")
     * - `source`: Origin of reference
     *
     *   - "from path parameter {paramName}"
     *   - "from authorized actor"
     *   - "from authorized session"
     *
     * See `AutoBeRealizeCollectorReference` for details.
     *
     * Empty array means the Create DTO contains all necessary references.
     */
    references: AutoBeRealizeCollectorReference[];
  }
}
