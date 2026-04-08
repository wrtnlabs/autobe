import { AutoBeRealizeCollectorReference } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

/**
 * Plans whether a single DTO needs a collector. Sets databaseSchemaName to null
 * for non-collectable DTOs.
 *
 * **Key Decisions**: Not all DTOs require collectors. Distinguish collectable
 * DTOs (Create DTO + DB-backed + direct mapping) from non-collectable DTOs
 * (read-only DTOs, computed types).
 */
export interface IAutoBeRealizeCollectorPlanApplication {
  /**
   * Analyzes the given DTO type and generates a plan entry determining whether
   * a collector is needed. Returns exactly ONE plan entry.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeRealizeCollectorPlanApplication.IProps): void;
}
export namespace IAutoBeRealizeCollectorPlanApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what schemas (database, DTO, operations) are
     * missing?
     *
     * For write: is this DTO collectable or non-collectable? What database
     * table does it map to (if collectable)?
     *
     * For complete: why you consider the decision final.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryComplete;
  }

  /**
   * Generates exactly ONE plan entry indicating collectable (has DB schema
   * name) or not (null).
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
     * Reasoning for this DTO's planning decision.
     *
     * Collectable: "Collects IShoppingSale.ICreate to shopping_sales with
     * nested category".
     *
     * Non-collectable: "IShoppingSale is read-only response DTO, not for
     * creation".
     */
    thinking: string;

    /**
     * Database table name if collectable (e.g., "shopping_sales"), null if
     * non-collectable (read-only DTO, computed type).
     */
    databaseSchemaName: string | null;

    /**
     * Referenced entities from path parameters or auth context.
     *
     * Each reference contains `databaseSchemaName` and `source` (e.g., "from
     * path parameter {id}", "from authorized actor"). Empty array means the
     * Create DTO contains all necessary references.
     */
    references: AutoBeRealizeCollectorReference[];
  }
}
