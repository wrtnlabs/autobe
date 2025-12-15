import { tags } from "typia";

/**
 * Request to retrieve analysis files from a previous version.
 *
 * This type is used to load analysis files (requirements documents) that were
 * generated in a **previous version** of the AutoBE generation pipeline.
 * This is NOT about re-requesting files within the same execution, but rather
 * accessing artifacts from an earlier version.
 *
 * **Use Case:** When regenerating or modifying the backend application based on
 * user change requests, agents need to reference the previously generated
 * analysis files to understand what was created before and what needs to be
 * modified.
 *
 * **Key Difference from `getAnalysisFiles`:**
 *
 * - `getAnalysisFiles`: Fetches analysis files from the **current version**
 *   (the version being generated right now)
 * - `getPreviousAnalysisFiles`: Fetches analysis files from the **previous
 *   version** (the last successfully generated version)
 *
 * **Example Scenario:**
 *
 * ```
 * Initial generation:
 * - ANALYZE phase creates: UserManagement.md, OrderWorkflow.md
 * - Generation completes successfully
 *
 * User: "Add payment integration to orders"
 *
 * Regeneration:
 * - ANALYZE phase starts regeneration
 * - Calls getPreviousAnalysisFiles(["OrderWorkflow.md"])
 *   → Loads the previous version of OrderWorkflow.md as reference
 * - Creates new version of OrderWorkflow.md with payment integration
 * ```
 *
 * **Waterfall + Spiral Pattern:**
 *
 * This aligns with AutoBE's regeneration cycles where:
 * - Compilation failures trigger regeneration
 * - User modifications trigger new versions
 * - Previous artifacts serve as reference context for improvements
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousAnalysisFiles {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousAnalysisFiles" indicates this is a
   * preliminary data request for analysis files from a previous version.
   */
  type: "getPreviousAnalysisFiles";

  /**
   * List of analysis file names to retrieve from the previous version.
   *
   * These are file names that were generated in a previous version and are
   * needed as reference context for the current regeneration.
   *
   * **Important Notes:**
   *
   * - These files MUST exist in the previous version
   * - This function is only available when a previous version exists
   * - Used for reference/comparison, not for re-requesting within same execution
   * - File names are the same as in the current version (e.g., "UserManagement.md")
   *
   * **When This Function is Available:**
   *
   * - When a previous version exists
   * - When user requests modifications to existing generated application
   * - During correction/regeneration cycles that need previous context
   *
   * **When This Function is NOT Available:**
   *
   * - During initial generation (no previous version exists)
   * - No previous artifacts available for this orchestration task
   */
  fileNames: string[] & tags.MinItems<1>;
}
