import { AutoBeRealizeCollectorReference } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

/**
 * Plans whether a single DTO needs a collector. Sets databaseSchemaName to null
 * for non-collectable DTOs.
 */
export interface IAutoBeRealizeCollectorPlanApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeCollectorPlanApplication.IProps): void;
}
export namespace IAutoBeRealizeCollectorPlanApplication {
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
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Generates exactly ONE plan entry indicating collectable (has DB schema
   * name) or not (null).
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Exactly ONE entry. databaseSchemaName non-null = collectable, null = no
     * collector needed.
     */
    plans: IPlan[];
  }

  /** Planning decision for one DTO. */
  export interface IPlan {
    /**
     * TypeScript interface type from the operation request body (e.g.,
     * "IShoppingSale.ICreate").
     */
    dtoTypeName: string;

    /**
     * Reasoning: why collectable (which DB table) or non-collectable
     * (read-only, computed, etc.).
     */
    thinking: string;

    /** Database table name if collectable (e.g., "shopping_sales"), null if not. */
    databaseSchemaName: string | null;

    /**
     * Referenced entities from path parameters or auth context. Empty if DTO is
     * self-contained.
     */
    references: AutoBeRealizeCollectorReference[];
  }
}
