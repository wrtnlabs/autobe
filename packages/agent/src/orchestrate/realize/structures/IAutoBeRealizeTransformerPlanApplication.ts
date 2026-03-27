import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

/**
 * Plans whether a single DTO needs a transformer. Sets databaseSchemaName to
 * null for non-transformable DTOs.
 *
 * **Key Decisions**: Not all DTOs require transformers. Distinguish
 * transformable DTOs (Read DTO + DB-backed + direct mapping) from
 * non-transformable DTOs (request params, pagination wrappers, business logic
 * types).
 */
export interface IAutoBeRealizeTransformerPlanApplication {
  /**
   * Analyzes the given DTO type and generates a plan entry determining whether
   * a transformer is needed. Returns exactly ONE plan entry.
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
     * For preliminary requests: what schemas (database or DTO) are missing?
     *
     * For completion: is this DTO transformable or non-transformable? What
     * database table does it map to (if transformable)?
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Generates exactly ONE plan entry indicating transformable (has DB schema
   * name) or not (null).
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Exactly ONE entry. databaseSchemaName non-null = transformable, null = no
     * transformer needed.
     */
    plans: IPlan[];
  }

  /** Planning decision for one DTO. */
  export interface IPlan {
    /**
     * TypeScript interface type from the operation response (e.g.,
     * "IShoppingSaleUnitStock").
     */
    dtoTypeName: string;

    /**
     * Reasoning for this DTO's planning decision.
     *
     * Transformable: "Transforms shopping_sales to IShoppingSale with nested
     * category and tags".
     *
     * Non-transformable: "IPage.IRequest is pagination parameter, not
     * DB-backed".
     */
    thinking: string;

    /**
     * Database table name if transformable (e.g., "shopping_sales"), null if
     * non-transformable (request param, pagination wrapper, business logic).
     */
    databaseSchemaName: string | null;
  }
}
