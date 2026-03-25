import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

/**
 * Plans whether a single DTO needs a transformer. Sets databaseSchemaName to
 * null for non-transformable DTOs.
 */
export interface IAutoBeRealizeTransformerPlanApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeTransformerPlanApplication.IProps): void;
}
export namespace IAutoBeRealizeTransformerPlanApplication {
  export interface IProps {
    /**
     * Reasoning about your current state: what's missing (preliminary) or what
     * you accomplished (completion).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
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
     * Reasoning: why transformable (which DB table) or non-transformable
     * (request param, pagination, etc.).
     */
    thinking: string;

    /**
     * Database table name if transformable (e.g., "shopping_sales"), null if
     * not.
     */
    databaseSchemaName: string | null;
  }
}
