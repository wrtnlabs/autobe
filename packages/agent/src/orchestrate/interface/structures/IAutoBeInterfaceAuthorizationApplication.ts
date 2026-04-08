import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
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
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /** Submit authorization operations. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Analysis of the actor's authentication requirements and schema context. */
    analysis: string;

    /** Rationale for authorization operation design decisions. */
    rationale: string;

    /** Array of API operations to generate for authorization. */
    operations: AutoBeOpenApi.IOperation[] & tags.MinItems<1>;
  }
}
