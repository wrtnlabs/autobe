import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceActionEndpointReviewApplication {
  /**
   * Process action endpoint review task or preliminary data requests.
   *
   * Reviews action (non-CRUD) endpoints for appropriateness, naming
   * consistency, duplicate detection, and alignment with business requirements.
   * Can create, update, or delete endpoints as needed.
   *
   * @param props Request containing either preliminary data request or endpoint
   *   modification operation
   * @returns The current list of endpoints after the operation
   */
  process(props: IAutoBeInterfaceActionEndpointReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceActionEndpointReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or modifying endpoints, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For endpoint operations (create, update, delete, complete):
     *
     * - What issue did you identify?
     * - Why is this modification necessary?
     * - How does this improve the API design?
     *
     * This reflection helps you make deliberate, justified modifications.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - `getAnalysisFiles`: Request requirement documents
     * - `getPrismaSchemas`: Request database schema information
     * - `complete`: Finish the review with all actions
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousPrismaSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /** Action type for endpoint modifications. */
  export type IAction = ICreate | IUpdate | IDelete;

  /**
   * Request to create a new action endpoint.
   *
   * Use this when you identify a missing action endpoint based on requirements:
   *
   * - Analytics/statistics endpoint mentioned in requirements but not generated
   * - Dashboard/overview endpoint needed for business operations
   * - Search endpoint for cross-entity queries
   * - Report endpoint for business intelligence
   */
  export interface ICreate {
    /** Type discriminator indicating this is a create operation. */
    type: "create";

    /** The new endpoint to add. */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Description of what this endpoint does.
     *
     * Functional description of the endpoint's purpose.
     */
    description: string;

    /**
     * Reason for creating this endpoint.
     *
     * Explain which requirement this endpoint fulfills and why it was missing.
     */
    reason: string;
  }

  /**
   * Request to update an existing action endpoint.
   *
   * Use this when an action endpoint has issues:
   *
   * - Path naming inconsistency (e.g., camelCase instead of hierarchical)
   * - Incorrect HTTP method (e.g., GET instead of PATCH for complex search)
   * - Path structure needs adjustment
   * - Redundant path segments
   */
  export interface IUpdate {
    /** Type discriminator indicating this is an update operation. */
    type: "update";

    /**
     * The original endpoint to modify.
     *
     * ⚠️ CRITICAL: Must be from the "Endpoints for Review" list provided above.
     * DO NOT reference endpoints that are not in the provided list.
     * Must match exactly (path + method).
     */
    original: AutoBeOpenApi.IEndpoint;

    /**
     * The updated endpoint definition.
     *
     * Contains the corrected path and/or method.
     */
    updated: AutoBeOpenApi.IEndpoint;

    /**
     * Updated description of what this endpoint does.
     *
     * Functional description of the endpoint's purpose.
     */
    description: string;

    /**
     * Reason for this update.
     *
     * Explain what issue this fixes and why the new definition is better.
     */
    reason: string;
  }

  /**
   * Request to delete an action endpoint.
   *
   * Use this when an action endpoint should be removed:
   *
   * - Not actually required by business requirements
   * - Duplicate functionality with base CRUD endpoints
   * - Duplicate with another action endpoint
   * - Over-engineered (too granular or unnecessary)
   * - Security concern
   */
  export interface IDelete {
    /** Type discriminator indicating this is a delete operation. */
    type: "delete";

    /**
     * The endpoint to remove.
     *
     * ⚠️ CRITICAL: Must be from the "Endpoints for Review" list provided above.
     * DO NOT reference endpoints that are not in the provided list.
     * Must match exactly (path + method).
     */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Reason for deletion.
     *
     * Explain why this endpoint should be removed and what issue it causes.
     */
    reason: string;
  }

  /**
   * Request to complete the review process.
   *
   * Call this when the review is finished. Include all endpoint modifications
   * (create, update, delete) in the actions array and provide a summary.
   *
   * ## Completion Criteria for Action Endpoints
   *
   * Before completing, ensure:
   *
   * - All action endpoints are justified by requirements (analytics, dashboard,
   *   search, reports keywords)
   * - No duplicate functionality with base CRUD endpoints
   * - No duplicate action endpoints (same functionality, different paths)
   * - Resource collection names use plural form
   * - All paths use hierarchical `/` structure (NOT camelCase concatenation)
   * - HTTP methods are appropriate (GET for simple, PATCH for complex queries)
   */
  export interface IComplete {
    /** Type discriminator indicating this is the completion request. */
    type: "complete";

    /**
     * All endpoint modifications to apply.
     *
     * Include all create, update, and delete actions identified during review.
     * Actions are validated and applied in order. If no modifications are
     * needed, provide an empty array.
     */
    actions: IAction[];

    /**
     * Comprehensive review summary.
     *
     * Summarize the review findings and all modifications made:
     *
     * - Number of endpoints created, updated, deleted
     * - Major issues identified and resolved
     * - Final assessment of the action endpoint collection
     */
    review: string;
  }
}
