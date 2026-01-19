import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeInterfaceAuthorizationApplication {
  /**
   * Process authorization operations generation task or preliminary data
   * requests.
   *
   * Generates authorization operations for the given roles and ensures the
   * interface reflects correct permissions and access levels.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceAuthorizationApplication.IProps): void;
}

export namespace IAutoBeInterfaceAuthorizationApplication {
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getDatabaseSchemas,
     * getPreviousDatabaseSchemas) or final authorization operations generation
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Request to generate authorization operations.
   *
   * Executes authorization operations generation to define the authorization
   * requirements for the given roles. Ensures operations reflect correct
   * permissions and access levels for each role.
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
     * Analysis of the actor's authentication requirements and schema context.
     *
     * Documents the agent's understanding of the actor type
     * (guest/member/admin), what authentication fields exist in the database
     * schema, what additional authentication features are supported by the
     * schema, and what operations are appropriate for this actor kind.
     */
    analysis: string;

    /**
     * Rationale for the authorization operation design decisions.
     *
     * Explains why specific operations were included or excluded, how the actor
     * kind influenced the essential operations selection (e.g., why guests
     * don't have login), what schema fields enabled additional operations, and
     * why certain authentication patterns were chosen.
     */
    rationale: string;

    /**
     * Array of API operations to generate authorization operation for.
     *
     * Each operation in this array must include:
     *
     * - Specification: Detailed API specification with clear purpose and
     *   functionality
     * - Path: Resource-centric URL path (e.g., "/resources/{resourceId}")
     * - Method: HTTP method (get, post, put, delete, patch)
     * - Description: Extremely detailed multi-paragraph description referencing
     *   database schema comments
     * - Summary: Concise one-sentence summary of the endpoint
     * - Parameters: Array of all necessary parameters with descriptions and
     *   schema definitions
     * - RequestBody: For POST/PUT/PATCH methods, with typeName referencing
     *   components.schemas
     * - ResponseBody: With typeName referencing appropriate response type
     *
     * All operations must follow strict quality standards:
     *
     * 1. Detailed descriptions referencing database schema comments
     * 2. Accurate parameter definitions matching path parameters
     * 3. Appropriate request/response body type references
     * 4. Consistent patterns for CRUD operations
     *
     * For list retrievals (typically PATCH), include pagination, search, and
     * sorting. For detail retrieval (GET), return a single resource. For
     * creation (POST), use .ICreate request body. For modification (PUT), use
     * .IUpdate request body.
     */
    operations: AutoBeOpenApi.IOperation[] & tags.MinItems<1>;
  }
}
