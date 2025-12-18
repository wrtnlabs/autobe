import { AutoBeAnalyzeActor, CamelCasePattern } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { tags } from "typia";

import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

export interface IAutoBeAnalyzeScenarioApplication {
  /**
   * Process scenario composition task or preliminary data requests.
   *
   * Composes project structure with actors and documentation files based on
   * requirements. Processes composition with incremental context loading to
   * ensure comprehensive scenario planning.
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
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles):
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
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPreviousAnalysisFiles) or final scenario
     * composition (complete). When preliminary returns empty array, that type
     * is removed from the union, physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to compose project structure with actors and documentation files.
   *
   * Executes scenario composition to determine the list of user actors and
   * documents to generate based on requirements.
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
     * precedence over the locale setting for determining document language.
     */
    language?: string;

    /**
     * If the user has requested a specific number of pages, enter that number.
     * Otherwise, provide an appropriate number of documents needed to meet the
     * user's requirements. This number must always match the length of the
     * files property, must be greater than 1, and must include the table of
     * contents. For example, if the user requests 3 pages, the total should be
     * 4, including the table of contents.
     */
    page: number;

    /**
     * Array of document metadata objects defining files to be generated.
     *
     * Each array element is an AutoBeAnalyzeFile.Scenario object containing:
     *
     * - Filename: The output file name (e.g., "01-service-overview.md")
     * - Reason: Why this document is being created
     * - DocumentType, outline, constraints, etc.: Metadata guiding content
     *   generation
     *
     * These documents represent business-focused planning documentation:
     *
     * - Business requirements and functional specifications in natural language
     * - User journey mapping and use case scenarios
     * - Business rules and workflow definitions
     * - Service overview and business model description
     * - User actors and permission requirements (described in natural language)
     * - Business logic and validation rules
     * - DO NOT: Include database schemas, ERD, or API specifications
     * - DO: Write all requirements in natural language for clarity
     *
     * Generate metadata objects based on actual requirements gathered from
     * conversation. Do not create unnecessary documentation - only generate
     * what is needed to properly define the business requirements and system
     * specifications.
     *
     * # Array Length Rules
     *
     * The array length must match the user's requested page count plus one for
     * ToC. For example: user requests 3 pages → generate 4 objects (1 ToC + 3
     * content). If user does not specify a number, generate sufficient objects
     * to adequately document the service (typically 11+ objects including
     * ToC).
     */
    files: Array<AutoBeAnalyzeFile.Scenario> & tags.MinItems<1>;
  }
}
