import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceOperationReviewApplication {
  /**
   * Process operation review task or preliminary data requests.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeInterfaceOperationReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceOperationReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing and why?
     *
     * For write: what review findings you're submitting and corrections
     * applied.
     *
     * For complete: why you consider the last write final.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /**
   * Submit API operation review. Can ONLY modify IOperation fields:
   *
   * - `specification`: Can fix implementation details, algorithm descriptions,
   *   database query logic
   * - `description`: Can fix soft delete mismatches, inappropriate security
   *   mentions, add schema references
   * - `requestBody`: Can modify both description and typeName
   * - `responseBody`: Can modify both description and typeName
   *
   * Return null to reject if issues exist in non-modifiable fields (path,
   * method, parameters, etc.).
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
