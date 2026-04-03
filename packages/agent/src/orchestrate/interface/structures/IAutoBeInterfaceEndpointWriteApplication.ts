import { AutoBeInterfaceEndpointDesign } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceEndpointWriteApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceEndpointWriteApplication.IProps): void;
}

export namespace IAutoBeInterfaceEndpointWriteApplication {
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

  /** Submit endpoint designs. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Analysis of requirements and database schema for endpoint design. */
    analysis: string;

    /** Rationale for the endpoint design decisions. */
    rationale: string;

    /**
     * Array of endpoint designs to generate.
     *
     * Path rules: hierarchical `/` structure, must start with `/`, no domain
     * prefixes, plural resource names. No duplicate endpoints. Path parameters
     * clearly named. Nested paths reflect entity relationships.
     */
    designs: AutoBeInterfaceEndpointDesign[];
  }
}

/** @deprecated Use IAutoBeInterfaceEndpointWriteApplication.IWrite instead. */
export type IAutoBeInterfaceEndpointWriteApplicationComplete =
  IAutoBeInterfaceEndpointWriteApplication.IWrite;
