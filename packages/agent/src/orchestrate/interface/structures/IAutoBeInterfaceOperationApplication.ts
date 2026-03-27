import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceOperationApplication {
  /**
   * Process operation generation task or preliminary data requests.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceOperationApplication.IProps): void;
}
export namespace IAutoBeInterfaceOperationApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing and why?
     * Be brief — state the gap, don't list everything you have.
     *
     * For completion: what key assets did you acquire, what did you accomplish,
     * why is it sufficient? Summarize — don't enumerate every single item.
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
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /** Request to generate a detailed API operation. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /** Analysis of the endpoint's purpose and context. */
    analysis: string;

    /** Rationale for the operation design decisions. */
    rationale: string;

    /**
     * The API operation to generate.
     *
     * Follow CRUD operation patterns:
     *
     * - List/search (PATCH `index`): include pagination, search, and sorting in
     *   request body
     * - Detail retrieval (GET `at`): return single full entity
     * - Creation (POST): use `.ICreate` request body
     * - Modification (PUT): use `.IUpdate` request body
     *
     * Use object types for request/response bodies, reference named component
     * types, and `application/json` content-type.
     */
    operation: IOperation;
  }

  /**
   * RESTful API operation (excludes authorization and prerequisite fields).
   *
   * Use object types for request/response bodies, reference named component
   * types, use `application/json` content-type, and `string &
   * tags.Format<"uri">` for file operations.
   */
  export interface IOperation extends Omit<
    AutoBeOpenApi.IOperation,
    "authorizationType" | "authorizationActor" | "prerequisites"
  > {}
}
