import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseComponentApplication {
  /**
   * Process table design task for a single component skeleton or preliminary
   * data requests.
   *
   * Receives a component skeleton (namespace, filename, thinking, review,
   * rationale already determined by DATABASE_GROUP phase) and fills in the
   * tables field with complete table designs for that single component.
   *
   * This is NOT about creating or organizing multiple components. The component
   * identity is fixed. This agent ONLY designs the tables that belong to the
   * provided component skeleton.
   *
   * @param props Request containing either preliminary data request or complete
   *   table design
   */
  process(props: IAutoBeDatabaseComponentApplication.IProps): void;
}

export namespace IAutoBeDatabaseComponentApplication {
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getPreviousDatabaseSchemas)
     * or final table design (complete). When preliminary returns empty array,
     * that type is removed from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Request to complete the database component by filling in table designs.
   *
   * Takes a component skeleton (namespace, filename already determined by
   * DATABASE_GROUP phase) and fills in the tables field by designing all
   * necessary database tables for this single component.
   *
   * This is NOT about creating multiple components - the component identity is
   * already fixed. This is ONLY about designing the tables that belong to this
   * single component.
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

    /**
     * Analysis of the component's scope and table requirements.
     *
     * Documents the agent's understanding of this component's domain:
     * - What is the component's business purpose (from the skeleton)?
     * - What entities from the requirements belong to this component?
     * - What relationships exist between these entities?
     * - What normalization patterns were identified?
     */
    analysis: string;

    /**
     * Rationale for the table design decisions.
     *
     * Explains why tables were designed this way:
     * - Why was each table created?
     * - Why were certain entities kept separate vs combined?
     * - What normalization principles were applied?
     * - How do the tables fulfill the component's rationale?
     */
    rationale: string;

    /**
     * Array of table designs for THIS SINGLE component.
     *
     * Contains all database tables that belong to the component skeleton
     * received as input. Each table design includes table name (snake_case,
     * plural) and description explaining the table's purpose and contents.
     *
     * The AI agent must design tables based on:
     *
     * - The component's namespace and intended domain (from skeleton)
     * - Business requirements from analysis files
     * - Previous database schemas for consistency
     * - Normalization principles (3NF)
     * - Relationship integrity
     *
     * CRITICAL CONSTRAINTS:
     *
     * - The namespace and filename are ALREADY DETERMINED by the component
     *   skeleton
     * - Do NOT create multiple components or reorganize component boundaries
     * - Do NOT include thinking, review, decision, or rationale - those are
     *   already in the skeleton
     * - ALL tables generated here belong to THE SINGLE component skeleton
     *   provided
     * - ONLY provide the tables array - nothing else
     */
    tables: AutoBeDatabaseComponentTableDesign[];
  }
}
