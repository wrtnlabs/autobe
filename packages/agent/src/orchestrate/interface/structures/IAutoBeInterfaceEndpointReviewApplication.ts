import { AutoBeInterfaceEndpointRevise } from "@autobe/interface";

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
   * Complete endpoint review with revision decisions (keep/create/update/erase)
   * for ALL endpoints.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

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
