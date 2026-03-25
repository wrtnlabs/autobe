import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceOperationApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceOperationApplication.IProps): void;
}
export namespace IAutoBeInterfaceOperationApplication {
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
     * For list/search (PATCH `index`), include pagination, search, and sorting
     * in the request body. For detail (GET `at`), return full entity. For
     * creation (POST), use `.ICreate`. For update (PUT), use `.IUpdate`.
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
