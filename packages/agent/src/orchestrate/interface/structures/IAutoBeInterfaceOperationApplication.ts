import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceOperationApplication {
  /**
   * Process operation generation task or preliminary data requests.
   *
   * Creates a complete API operation following REST principles and quality
   * standards. Processes the operation with progress tracking to ensure
   * iterative completion.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceOperationApplication.IProps): void;
}
export namespace IAutoBeInterfaceOperationApplication {
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
     * (getAnalysisFiles, getDatabaseSchemas, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas) or final operation generation (complete).
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /**
   * Request to generate a detailed API operation.
   *
   * Executes operation generation to create a complete API operation following
   * REST principles and quality standards. The operation includes
   * specification, path, method, detailed description, summary, parameters, and
   * request/response bodies.
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
     * Analysis of the endpoint's purpose and context.
     *
     * Before designing the operation, analyze what you know:
     *
     * - What is this endpoint for? What business requirement does it fulfill?
     * - What database entities and fields are involved?
     * - What parameters, request body, and response are needed?
     * - What authorization actors should have access?
     */
    analysis: string;

    /**
     * Rationale for the operation design decisions.
     *
     * Explain why you designed the operation this way:
     *
     * - Why did you choose these parameters and body types?
     * - What authorization actors did you select and why?
     * - How does this operation fulfill the endpoint description?
     * - What was excluded from the design and why?
     */
    rationale: string;

    /**
     * The API operation to generate.
     *
     * The operation includes:
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
     * The operation follows strict quality standards:
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
    operation: IOperation;
  }

  /**
   * Operation of the Restful API.
   *
   * This interface defines a single API endpoint with its HTTP {@link method},
   * {@link path}, {@link parameters path parameters},
   * {@link requestBody request body}, and {@link responseBody} structure. It
   * corresponds to an individual operation in the paths section of an OpenAPI
   * document.
   *
   * Each operation requires a detailed explanation of its purpose through the
   * reason and description fields, making it clear why the API was designed and
   * how it should be used.
   *
   * DO: Use object types for all request bodies and responses. DO: Reference
   * named types defined in the components section. DO: Use `application/json`
   * as the content-type. DO: Use `string & tags.Format<"uri">` in the schema
   * for file upload/download operations instead of binary data formats.
   *
   * In OpenAPI, this might represent:
   *
   * ```json
   * {
   *   "/shoppings/customers/orders": {
   *     "post": {
   *       "description": "Create a new order application from shopping cart...",
   *       "parameters": [...],
   *       "requestBody": {...},
   *       "responses": {...}
   *     }
   *   }
   * }
   * ```
   */
  export interface IOperation extends Omit<
    AutoBeOpenApi.IOperation,
    "authorizationType" | "authorizationActor" | "prerequisites"
  > {}
}
