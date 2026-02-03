import { AutoBeDatabaseDeduplicationGroup } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseDeduplicationApplication {
  /**
   * Analyze tables for semantic duplicates across components.
   *
   * Your PRIMARY task is to compare the target component's tables against all
   * other components' tables and identify groups of tables that serve the same
   * purpose, even if they have different names.
   *
   * ALWAYS fetch analysis files first using `getAnalysisFiles` to understand
   * the business context, then systematically compare tables and build
   * duplicate groups.
   *
   * @param props Request containing either preliminary data request or complete
   *   task with duplicate groups
   */
  process(props: IAutoBeDatabaseDeduplicationApplication.IProps): void;
}

export namespace IAutoBeDatabaseDeduplicationApplication {
  export interface IProps {
    /**
     * Reflect on the deduplication analysis before acting.
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas):
     *
     * - What requirements documents do you need to understand table purposes?
     * - Which business domains need to be understood for comparison?
     *
     * For completion (complete):
     *
     * - How many duplicate groups did you find?
     * - Which tables are duplicated and why?
     * - Summarize the comparison results.
     */
    thinking: string;

    /**
     * Request type discriminator.
     *
     * Use preliminary requests (getAnalysisFiles, etc.) to fetch requirements
     * documents for understanding table purposes. Use complete to submit
     * duplicate group identification results.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit duplicate group identification results.
   *
   * Call this after you have:
   *
   * 1. Fetched and analyzed requirements documents
   * 2. Compared each target component table against all other tables
   * 3. Identified groups of semantically equivalent tables
   */
  export interface IComplete {
    /**
     * Type discriminator. Value "complete" indicates final submission.
     */
    type: "complete";

    /**
     * Analysis of the deduplication comparison process.
     *
     * **REQUIRED STRUCTURE - Follow this Chain of Thought:**
     *
     * ## Step 1: Target Table Inventory
     *
     * For EACH table in target component, extract from its description:
     *
     * - Table name
     * - Role tag: `[MASTER DATA]`, `[INPUT]`, `[OUTPUT]`, `[AUDIT]`, `[CONFIG]`,
     *   `[SNAPSHOT]`, `[JUNCTION]`
     * - Core entity it stores
     * - Business workflow context
     * - Distinguishing characteristics (especially "does NOT store X" phrases)
     *
     * ## Step 2: Systematic Comparison
     *
     * For EACH target table, compare against EACH table in other components:
     *
     * ```
     * ### Comparing: {target_table} vs {other_component}.{other_table}
     *
     * **Target description**: "{quoted description}"
     * **Other description**: "{quoted description}"
     *
     * Role Match: [MASTER DATA] vs [MASTER DATA] → SAME / DIFFERENT
     * Entity Match: "customer identity" vs "customer credentials" → SAME /
     *   DIFFERENT
     * Workflow Match: "registration flow" vs "auth flow" → SAME / DIFFERENT
     * Distinguishing Check: Does either explicitly exclude the other's purpose?
     *
     * VERDICT: DUPLICATE / NOT DUPLICATE
     * REASON: {specific reason based on description comparison}
     * ```
     *
     * ## Step 3: Summary
     *
     * - Total tables in target component: X
     * - Total tables in other components: X
     * - Total comparisons made: X
     * - Duplicate groups found: X
     */
    analysis: string;

    /**
     * Rationale for the duplicate group decisions.
     *
     * **REQUIRED STRUCTURE:**
     *
     * ## For EACH duplicate group identified:
     *
     * - Quote BOTH descriptions showing same purpose
     * - Identify matching elements: same role tag, same core entity, same
     *   workflow
     * - Explain WHY these descriptions indicate same business function
     *
     * ## For tables explicitly NOT grouped (similar-looking but different):
     *
     * Common patterns to explicitly address and explain why NOT duplicates:
     *
     * - `[INPUT]` vs `[OUTPUT]` in same workflow (questions vs answers)
     * - `[MASTER DATA]` vs `[SNAPSHOT]` of same entity (orders vs
     *   order_snapshots)
     * - `[MASTER DATA]` vs `[AUDIT]` (entities vs logs)
     * - Tables with explicit "does NOT store X" that excludes the other
     * - Different actor ownership (customer creates vs seller creates)
     *
     * Quote the distinguishing parts of descriptions that prove non-duplication.
     */
    rationale: string;

    /**
     * Groups of semantically duplicate tables.
     *
     * Each group contains tables from different components that serve the
     * same purpose. Empty array if no duplicates are found.
     *
     * ## Group Rules:
     *
     * - Each group must have at least 2 tables
     * - Each group must include at least 1 table from the target component
     * - Each table can appear in only one group
     *
     * ## ⚠️ CRITICAL: 4-Step Duplicate Detection Using Rich Descriptions
     *
     * Tables now have structured descriptions with role tags and distinguishing
     * characteristics. Use this 4-step process:
     *
     * **Step 1: Extract and Compare Role Tags**
     *
     * Read the `[ROLE TAG]` at the start of each description:
     *
     * - Same role tag → Proceed to Step 2
     * - Different role tags → NOT duplicates (stop here)
     *   - `[INPUT]` ≠ `[OUTPUT]` (workflow stages)
     *   - `[MASTER DATA]` ≠ `[SNAPSHOT]` (live vs point-in-time)
     *   - `[MASTER DATA]` ≠ `[AUDIT]` (entity vs log)
     *
     * **Step 2: Compare Core Entity**
     *
     * What SPECIFIC business entity does each table store?
     *
     * - "customer identity" vs "customer credentials" → DIFFERENT entities
     * - "customer identity" vs "customer accounts" → SAME entity (investigate)
     * - "order cancellation requests" vs "refund processing" → DIFFERENT
     *
     * **Step 3: Compare Business Context**
     *
     * What workflow uses this table? What's the creation trigger?
     *
     * - Same workflow position = likely duplicate
     * - Different workflow stages = NOT duplicate
     * - Different creation triggers = likely NOT duplicate
     *
     * **Step 4: Check Distinguishing Characteristics**
     *
     * Look for explicit exclusions in descriptions:
     *
     * - "does NOT store X - see Y for that" → X and Y are NOT duplicates
     * - "different from Z which tracks..." → NOT duplicate of Z
     * - "separate because different actor owns" → NOT duplicate
     *
     * ## Example: Duplicate Found
     *
     * ```
     * Table A: "[MASTER DATA] Customer identity for shopping platform.
     *   Stores name, phone, address..."
     * Table B: "[MASTER DATA] Customer accounts for marketplace.
     *   Stores name, email, phone..."
     *
     * Step 1: Both [MASTER DATA] ✓
     * Step 2: Both "customer identity/accounts" = SAME entity ✓
     * Step 3: Both for customer management workflow ✓
     * Step 4: No explicit exclusions
     *
     * → DUPLICATE: Same customer entity in different components
     * ```
     *
     * ## Example: NOT Duplicate (Different Roles)
     *
     * ```
     * Table A: "[INPUT] Customer questions about products..."
     * Table B: "[OUTPUT] Seller answers to customer questions..."
     *
     * Step 1: [INPUT] vs [OUTPUT] = DIFFERENT roles ✗
     *
     * → NOT DUPLICATE: Different workflow stages (stop at Step 1)
     * ```
     *
     * ## Example: NOT Duplicate (Explicit Exclusion)
     *
     * ```
     * Table A: "[MASTER DATA] Customer authentication credentials...
     *   Does NOT store profile data - see customer_profiles"
     * Table B: "[MASTER DATA] Customer profile information...
     *   Stores name, address, preferences..."
     *
     * Step 1: Both [MASTER DATA] ✓
     * Step 2: "credentials" vs "profile" = DIFFERENT entities ✗
     * Step 4: Explicit "does NOT store profile data"
     *
     * → NOT DUPLICATE: Explicitly separated concerns
     * ```
     */
    duplicateGroups: AutoBeDatabaseDeduplicationGroup[];
  }
}
