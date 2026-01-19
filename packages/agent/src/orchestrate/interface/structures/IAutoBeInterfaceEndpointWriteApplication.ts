import { AutoBeInterfaceEndpointDesign } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceEndpointWriteApplication {
  /**
   * Process endpoint generation task or preliminary data requests.
   *
   * Generates API endpoints based on requirements analysis and database
   * schemas. Endpoints are created to fulfill business requirements while
   * adhering to RESTful design principles and AutoBE conventions.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceEndpointWriteApplication.IProps): void;
}

export namespace IAutoBeInterfaceEndpointWriteApplication {
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
     * (getAnalysisFiles, getDatabaseSchemas) or final endpoint generation
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
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
   * Request to complete endpoint generation.
   *
   * Finalizes the endpoint generation task by submitting all generated
   * endpoints. Each endpoint is derived from requirements analysis and database
   * schemas, designed to fulfill specific business needs while maintaining
   * RESTful conventions and API design best practices.
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
     * Analysis of the requirements and database schema for endpoint design.
     *
     * Before designing endpoints, analyze what you know:
     *
     * - What business requirements need API coverage?
     * - What database entities and relationships inform endpoint structure?
     * - What CRUD operations are needed for each entity?
     * - What special operations beyond basic CRUD are required?
     */
    analysis: string;

    /**
     * Rationale for the endpoint design decisions.
     *
     * Explain why you designed endpoints this way:
     *
     * - Why did you choose these paths and methods?
     * - How do endpoints map to requirements and entities?
     * - What RESTful conventions did you follow?
     * - What was excluded and why?
     */
    rationale: string;

    /**
     * Array of endpoint designs to generate.
     *
     * Each design pairs an endpoint (path + method) with a description of its
     * purpose. All endpoints must adhere to RESTful conventions and AutoBE
     * design standards.
     *
     * ## Path Structure
     *
     * - Must use hierarchical `/` structure (NOT camelCase concatenation)
     * - Must start with `/`
     * - Must NOT include domain prefixes (`/shopping/`, `/bbs/`)
     * - Resource collection names should use plural form
     *
     * ## Common Validation Rules
     *
     * - Must NOT duplicate existing endpoints
     * - HTTP methods must align with their semantic meanings
     * - Path parameters must be clearly named (e.g., `{userId}`, `{productId}`)
     * - Nested paths should reflect entity relationships
     *
     * @see AutoBeInterfaceEndpointDesign - Endpoint design type with description
     */
    designs: AutoBeInterfaceEndpointDesign[];
  }
}
