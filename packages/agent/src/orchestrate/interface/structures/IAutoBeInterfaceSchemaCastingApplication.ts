import { AutoBeInterfaceSchemaCasting } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
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
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Submit schema casting analysis via Chain-of-Thought (observation,
   * reasoning, verdict).
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
