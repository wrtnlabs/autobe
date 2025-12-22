import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceBaseEndpointReviewApplication {
  /**
   * Process base endpoint review task or preliminary data requests.
   *
   * Reviews base CRUD endpoints for appropriateness, naming consistency,
   * duplicate detection, and plural/singular normalization. Can create, update,
   * or delete endpoints as needed.
   *
   * @param props Request containing either preliminary data request or endpoint
   *   modification operation
   * @returns The current list of endpoints after the operation
   */
  process(props: IAutoBeInterfaceBaseEndpointReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceBaseEndpointReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or modifying endpoints, reflect on
     * your current state and explain your descriptioning:
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
   * Request to create a new endpoint.
   *
   * Use this when you identify a missing endpoint that should exist based on
   * requirements analysis. This is rare for base endpoint review since base
   * endpoints are generated from Prisma schemas, but may be needed if:
   *
   * - A required CRUD operation was accidentally omitted
   * - A nested endpoint path is needed for subsidiary entities
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
     * Explain why this endpoint is necessary and what requirement it fulfills.
     */
    reason: string;
  }

  /**
   * Request to update an existing endpoint.
   *
   * Use this when an endpoint has issues that need correction:
   *
   * - Path naming inconsistency (e.g., `/users` vs `/user`)
   * - Incorrect HTTP method
   * - Path structure needs adjustment (e.g., nesting for subsidiary)
   * - Parameter naming issues (e.g., `{id}` → `{userId}`)
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
   * Request to delete an endpoint.
   *
   * Use this when an endpoint should be removed:
   *
   * - Duplicate functionality with another endpoint
   * - Not required by business requirements
   * - Security concern (exposes sensitive data)
   * - Over-engineering (unnecessary granularity)
   * - Violates stance rules (e.g., independent endpoint for subsidiary entity)
   * - Singular form when plural already exists
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
   * ## Completion Criteria
   *
   * Before completing, ensure:
   *
   * - All endpoints are necessary for the service requirements
   * - No duplicate endpoints exist (same functionality, different paths)
   * - Resource collection names use plural form
   * - Naming follows hierarchical `/` structure (NOT camelCase concatenation)
   * - Stance rules are respected (subsidiary → nested, snapshot → read-only)
   * - Composite unique constraints are respected (nested paths for scoped codes)
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
     * - Final assessment of the endpoint collection
     */
    review: string;
  }
}
