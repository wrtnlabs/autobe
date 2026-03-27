import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeInterfaceAuthorizationApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceAuthorizationApplication.IProps): void;
}

export namespace IAutoBeInterfaceAuthorizationApplication {
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
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /** Request to generate authorization operations. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /** Analysis of the actor's authentication requirements and schema context. */
    analysis: string;

    /** Rationale for authorization operation design decisions. */
    rationale: string;

    /** Array of API operations to generate for authorization. */
    operations: AutoBeOpenApi.IOperation[] & tags.MinItems<1>;
  }
}
