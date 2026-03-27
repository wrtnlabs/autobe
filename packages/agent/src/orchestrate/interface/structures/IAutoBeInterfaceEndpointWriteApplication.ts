import { AutoBeInterfaceEndpointDesign } from "@autobe/interface";

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

  /** Request to complete endpoint generation. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

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
