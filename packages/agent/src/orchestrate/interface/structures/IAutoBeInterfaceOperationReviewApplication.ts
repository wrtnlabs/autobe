import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceOperationReviewApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceOperationReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceOperationReviewApplication {
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

  /**
   * Review and validate an API operation. Can only modify IOperation fields
   * (specification, description, requestBody, responseBody). Return null to
   * reject if issues exist in non-modifiable fields.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /** Operation-level review findings organized by severity. */
    review: string;

    /**
     * Action plan for corrections, or "No improvements required. Operation
     * meets standards."
     */
    plan: string;

    /**
     * Corrected operation with fixes applied. Null when no changes are needed.
     * If issues exist in non-modifiable fields, also set to null (the `plan`
     * field should explain why).
     */
    content: IOperation | null;
  }

  /**
   * Operation subset containing only modifiable fields. Return null if
   * non-modifiable fields have issues.
   */
  export interface IOperation extends Pick<
    AutoBeOpenApi.IOperation,
    "specification" | "description" | "requestBody" | "responseBody"
  > {}
}
