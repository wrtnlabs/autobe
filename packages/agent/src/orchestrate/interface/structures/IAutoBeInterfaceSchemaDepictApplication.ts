import { AutoBeInterfaceSchemaDepict } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

/**
 * Application interface for the schema description enhancement agent.
 *
 * This agent focuses exclusively on improving documentation quality within
 * DTO schemas. It does NOT modify schema structure - that is handled by
 * {@link IAutoBeInterfaceSchemaPropertyApplication}.
 *
 * ## Responsibilities
 *
 * ### Schema-Level Descriptions
 * Multi-paragraph, comprehensive type documentation:
 * - First line: Brief summary of the type's purpose
 * - Following paragraphs: Detailed explanation, relationships, usage context
 *
 * ### Property-Level Descriptions
 * Clear, detailed documentation for each field:
 * - Purpose of the field (not just repeating the name)
 * - Business rules and validation constraints
 * - Format information and examples when helpful
 *
 * ### Context Integration
 * - Business domain knowledge from requirements
 * - Validation rules and constraints
 * - Database comments from Prisma `///` annotations
 *
 * ## Execution Order
 *
 * Depiction runs AFTER property review is complete. This ensures descriptions
 * are written for the final, structurally correct schema.
 *
 * ## Scope Limitation
 *
 * This agent can ONLY modify `description` fields. It cannot:
 * - Add or remove properties
 * - Change property types or formats
 * - Modify the `required` array
 *
 * @author Samchon
 */
export interface IAutoBeInterfaceSchemaDepictApplication {
  /**
   * Process schema description enhancement or preliminary data requests.
   *
   * Analyzes and improves documentation quality in OpenAPI schema definitions.
   * Returns granular description update commands targeting either the schema
   * itself or specific properties.
   *
   * @param props Request containing either preliminary data request or
   *   complete task with description updates
   */
  process(props: IAutoBeInterfaceSchemaDepictApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaDepictApplication {
  /**
   * Input properties for the process function.
   */
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
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
     * (getAnalysisFiles, getDatabaseSchemas, getInterfaceOperations,
     * getInterfaceSchemas) or final depiction (complete). When preliminary
     * returns empty array, that type is removed from the union, physically
     * preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Request to complete description enhancement.
   *
   * Executes documentation review and returns individual description update
   * commands for the schema and its properties.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Value "complete" indicates this is the final task execution request
     * containing the description update results.
     */
    type: "complete";

    /**
     * Human-readable summary of documentation improvements.
     *
     * Documents the analysis of current description quality, identifying
     * areas that needed improvement such as missing schema descriptions,
     * brief property descriptions, or opportunities to add context.
     */
    review: string;

    /**
     * Array of description update commands.
     *
     * Each depiction targets either:
     *
     * - **Schema description** (key: null): Update the type-level documentation
     * - **Property description** (key: "fieldName"): Update a specific field
     *
     * The array may be empty if all descriptions are already adequate.
     * Each depiction includes a brief `reason` explaining the improvement.
     *
     * Unlike property revisions, depiction reasons can be simple since
     * description improvements are generally straightforward enhancements.
     */
    depicts: AutoBeInterfaceSchemaDepict[];
  }
}
