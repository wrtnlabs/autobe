import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceBaseEndpointApplication {
  /**
   * Process endpoint generation task or preliminary data requests.
   *
   * Creates Restful API endpoints referencing requirement analysis documents
   * and Prisma schema files with ERD descriptions. Ensures endpoints cover all
   * requirements and entities.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceBaseEndpointApplication.IProps): void;
}

export namespace IAutoBeInterfaceBaseEndpointApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getPrismaSchemas,
     * getPreviousPrismaSchemas) or final endpoint generation (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousPrismaSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /** The base endpoints to generate. */
    endpoints: IEndpoint[] & tags.MinItems<1>;
  }

  export interface IEndpoint {
    /** The endpoint definition containing path and HTTP method. */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Explanation of why this endpoint was created.
     *
     * Describes the purpose, use case, or requirement that this endpoint
     * fulfills. This context helps the EndpointReview agent to:
     *
     * - Identify duplicate or redundant endpoints
     * - Detect missing functionality
     * - Verify that path/method aligns with the intended purpose
     */
    description: string;
  }
}
