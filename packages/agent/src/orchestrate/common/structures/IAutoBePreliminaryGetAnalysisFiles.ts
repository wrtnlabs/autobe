import { tags } from "typia";

/**
 * Request to retrieve requirements analysis files for context.
 *
 * This type is used in the preliminary phase to request specific analysis files
 * that provide business requirements and domain context.
 */
export interface IAutoBePreliminaryGetAnalysisFiles {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getAnalysisFiles" indicates this is a preliminary
   * data request for analysis files.
   */
  type: "getAnalysisFiles";

  /**
   * List of analysis file names to retrieve.
   *
   * File names from the analyze phase containing requirements, use cases, and
   * business logic documentation.
   *
   * CRITICAL: DO NOT request the same file names that you have already
   * requested in previous calls.
   */
  fileNames: string[] & tags.MinItems<1>;
}
