import { AutoBeInterfaceEndpointRevise } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceEndpointReviewApplication {
  /**
   * Process task or retrieve preliminary data. Every endpoint MUST receive a
   * revision decision.
   */
  process(props: IAutoBeInterfaceEndpointReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceEndpointReviewApplication {
  export interface IProps {
    /**
     * Reasoning: what's missing (preliminary), what you're submitting (write),
     * or why you're finalizing (complete).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
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
   * Submit endpoint review with revision decisions (keep/create/update/erase)
   * for ALL endpoints.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Summary of issues found and fixes applied. State "No issues found." if
     * all pass.
     */
    review: string;

    /**
     * Revision decisions for ALL endpoints. One revision per endpoint, no
     * omissions. The endpoint field in keep/update/erase must exactly match a
     * provided endpoint (path + method).
     */
    revises: AutoBeInterfaceEndpointRevise[];
  }
}
