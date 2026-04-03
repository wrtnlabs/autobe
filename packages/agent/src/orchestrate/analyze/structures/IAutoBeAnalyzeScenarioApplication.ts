import {
  AutoBeAnalyze,
  AutoBeAnalyzeScenarioEntity,
  CamelCasePattern,
} from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { FixedAnalyzeTemplateFeature } from "./FixedAnalyzeTemplate";

export interface IAutoBeAnalyzeScenarioApplication {
  /**
   * Compose project structure (actors, entities, prefix, language) or request
   * preliminary data.
   */
  process(props: IAutoBeAnalyzeScenarioApplication.IProps): void;
}

export namespace IAutoBeAnalyzeScenarioApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what previous analysis sections are missing?
     *
     * For completion: is the DTO transformable or non-transformable? What
     * actors, entities, and prefix were chosen based on requirements?
     */
    thinking?: string | null;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetPreviousAnalysisSections;
  }

  /** Submit project structure with actors and entities (6-file SRS template). */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Why these actors, entities, and prefix were chosen based on requirements. */
    reason: string;

    /** Prefix for file/variable names (camelCase). */
    prefix: string & CamelCasePattern;

    /** Actors for the project (name, kind, description). */
    actors: AutoBeAnalyze.IActor[];

    /**
     * Language for document content. Overrides locale if set; null if not
     * specified.
     */
    language: string | null;

    /**
     * AUTHORITATIVE entity list — all downstream writers MUST reference only
     * these entities. Include ALL domain entities; do NOT include meta-entities
     * describing the requirements process.
     */
    entities: AutoBeAnalyzeScenarioEntity[];

    /**
     * Features activating conditional modules. DEFAULT IS EMPTY ARRAY [].
     *
     * WARNING: Wrong activation causes cascading hallucination across ALL SRS
     * files. Include ONLY if user used exact trigger keywords:
     *
     * - "file-storage": "file upload", "attachment", "image upload"
     * - "real-time": "real-time", "WebSocket", "live updates", "chat"
     * - "external-integration": "payment", "Stripe", "OAuth", "email service"
     *
     * Standard CRUD with auth = []. Do NOT activate based on inference.
     */
    features: FixedAnalyzeTemplateFeature[];
  }
}
