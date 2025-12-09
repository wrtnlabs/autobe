import { tags } from "typia";

/**
 * Request to re-retrieve previously requested analysis files for context.
 *
 * This type is used in the preliminary phase to re-request analysis files that
 * were already fetched in previous iterations within the same orchestration
 * task. Unlike `IAutoBePreliminaryGetAnalysisFiles` which retrieves NEW files
 * from the global state, this retrieves files from the LOCAL context that were
 * previously requested.
 *
 * **Use Case:** When an agent needs to access analysis files across multiple
 * RAG iterations, it may need to re-request files from earlier iterations to
 * maintain context. This is particularly useful in complement cycles where the
 * agent needs to reference previously loaded requirements without exceeding the
 * request budget.
 *
 * **Key Difference from Regular `getAnalysisFiles`:**
 *
 * - Regular: Fetches NEW files from global state (not yet in local context)
 * - GetPrevious: Re-fetches files ALREADY in local context from prior requests
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousAnalysisFiles {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousAnalysisFiles" indicates this is a
   * preliminary data request for previously requested analysis files.
   */
  type: "getPreviousAnalysisFiles";

  /**
   * List of analysis file names to re-retrieve from previous requests.
   *
   * File names that were already requested in previous iterations within this
   * orchestration task. These files should exist in the local context.
   *
   * **Important Notes:**
   *
   * - These file names MUST have been requested in a previous iteration
   * - Requesting non-existent or never-before-requested files will fail
   * - Use this to maintain context across multiple RAG cycles
   * - Prefer this over `getAnalysisFiles` when you need to re-access known files
   */
  fileNames: string[] & tags.MinItems<1>;
}
