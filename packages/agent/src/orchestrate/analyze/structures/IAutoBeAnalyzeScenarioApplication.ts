import { AutoBeAnalyzeRole, CamelPattern } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { tags } from "typia";

export interface IAutoBeAnalyzeScenarioApplication {
  /**
   * Compose project structure with roles and files.
   *
   * Design a list of roles and initial documents that you need to create for
   * that requirement. Roles define team member responsibilities, while files
   * define the documentation structure. These are managed separately. If you
   * determine from the conversation that the user's requirements have not been
   * fully gathered, you must stop the analysis and continue collecting the
   * remaining requirements. In this case, you do not need to generate any files
   * or roles. Simply pass an empty array to `input.files` and `input.roles`.
   *
   * @param input Prefix, roles, and files
   * @returns
   */
  compose(input: IAutoBeAnalyzeScenarioApplication.IProps): void;
}

export namespace IAutoBeAnalyzeScenarioApplication {
  export interface IProps {
    /** Reason for the analysis and composition of the project structure. */
    reason: string;

    /**
     * Prefix for file names and variable names. This will be used for
     * organizing documentation files.
     *
     * DO: Use camelCase naming convention.
     */
    prefix: string & CamelPattern;

    /** Roles to be assigned for the project */
    roles: AutoBeAnalyzeRole[];

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
     * # Document files to be generated
     *
     * File name must be English and it must contain the numbering and prefix.
     *
     * These files represent business documentation that may include:
     *
     * - Business requirements and functional specifications in natural language
     * - User journey mapping and use case scenarios
     * - Business rules and workflow definitions
     * - Service overview and business model description
     * - User roles and permission requirements (described in natural language)
     * - Business logic and validation rules
     * - DO NOT: Include database schemas, ERD, or API specifications
     * - DO: Write all requirements in natural language for clarity
     *
     * Generate files based on actual requirements gathered from conversation.
     * Do not create unnecessary documentation - only generate what is needed to
     * properly define the business requirements and system specifications.
     *
     * # Page Length Rules
     *
     * The number of documents must match the user's request, excluding the
     * table of contents. For example, if the user requests 3 pages, a total of
     * 4 documents should be generated, including the table of contents. If the
     * user does not specify a number, generate a sufficient number of documents
     * to adequately support the service.
     */
    files: Array<AutoBeAnalyzeFile.Scenario> & tags.MinItems<1>;
  }
}
