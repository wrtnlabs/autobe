import { AutoBeInterfaceSchemaCasting } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

/**
 * Detects and corrects degenerate type aliases (primitives that should be
 * objects).
 */
export interface IAutoBeInterfaceSchemaCastingApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceSchemaCastingApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaCastingApplication {
  /** Properties for schema casting processing. */
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
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Complete schema casting analysis via Chain-of-Thought (observation,
   * reasoning, verdict).
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Factual observation of the current type definition, JSDoc, schema hints,
     * and naming.
     */
    observation: string;

    /** Reasoning about whether documentation contradicts the primitive type. */
    reasoning: string;

    /**
     * Final verdict: "degenerate" (needs casting to object) or "valid
     * primitive".
     */
    verdict: string;

    /**
     * Corrected object schema casting design, or `null` if the primitive is
     * intentional.
     */
    casting: AutoBeInterfaceSchemaCasting | null;
  }
}
