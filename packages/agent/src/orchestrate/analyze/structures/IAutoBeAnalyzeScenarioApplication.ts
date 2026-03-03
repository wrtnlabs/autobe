import { AutoBeAnalyzeActor, CamelCasePattern } from "@autobe/interface";

import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { FixedAnalyzeTemplate } from "./FixedAnalyzeTemplate";

export interface IAutoBeAnalyzeScenarioApplication {
  /**
   * Process scenario composition task or preliminary data requests.
   *
   * Composes project structure with actors and entities based on requirements.
   * File structure is fixed (6-file SRS template); the LLM only determines
   * actors, entities, prefix, and language.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeScenarioApplication.IProps): void;
}

export namespace IAutoBeAnalyzeScenarioApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getPreviousAnalysisFiles):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplished?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking?: string | null;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getPreviousAnalysisFiles) or final scenario composition (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to compose project structure with actors and entities.
   *
   * The document file structure is fixed as 6-file SRS template. LLM only
   * determines actors, entities, prefix, and language. Files are generated
   * programmatically from FixedAnalyzeTemplate.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /** Reason for the analysis and composition of the project structure. */
    reason: string;

    /**
     * Prefix for file names and variable names. This will be used for
     * organizing documentation files.
     *
     * DO: Use camelCase naming convention.
     */
    prefix: string & CamelCasePattern;

    /**
     * Actors to be assigned for the project.
     *
     * Each actor has:
     *
     * - `name`: Actor identifier (camelCase)
     * - `kind`: "guest" | "member" | "admin"
     * - `description`: Actor's permissions and capabilities
     */
    actors: AutoBeAnalyzeActor[];

    /**
     * Language for document content. When specified by the user, this takes
     * precedence over the locale setting for determining document language. Set
     * to `null` if not specified.
     */
    language: string | null;

    /**
     * Core domain entities with their key attributes and relationships.
     *
     * These serve as the AUTHORITATIVE entity list — all downstream document
     * writers (module, unit, section) MUST reference only these entities. This
     * prevents hallucination and ensures cross-file consistency.
     *
     * Each entity should include:
     *
     * - `name`: PascalCase entity name (e.g., "Todo", "User", "Comment")
     * - `attributes`: Key attributes with type hints (e.g., "title: text(1-500),
     *   required")
     * - `relationships`: How this entity relates to others (e.g., "belongsTo User
     *   via userId")
     *
     * Include ALL domain entities that will appear in the requirements
     * documents. Do NOT include meta-entities (InterpretationLog,
     * ScopeDecisionLog, etc.) that describe the requirements process rather
     * than the production system.
     */
    entities: Array<{
      name: string;
      attributes: string[];
      relationships?: string[];
    }>;

    /**
     * High-level project features that activate conditional modules.
     *
     * Selected from a FIXED catalog — the LLM must NOT invent features outside
     * the predefined list. Each feature activates additional modules in the
     * appropriate SRS files.
     *
     * If the project has no special features beyond REST CRUD, return an empty
     * array.
     */
    features: FixedAnalyzeTemplate.IFeature[];
  }
}
