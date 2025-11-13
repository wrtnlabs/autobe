import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceEndpointApplication {
  /**
   * Process endpoint generation task or preliminary data requests.
   *
   * Creates Restful API endpoints referencing requirement analysis documents and
   * Prisma schema files with ERD descriptions. Ensures endpoints cover all
   * requirements and entities.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceEndpointApplication.IProps): void;
}

export namespace IAutoBeInterfaceEndpointApplication {
  export interface IProps {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas) or final endpoint generation
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas;
  }

  /**
   * Request to create Restful API endpoints.
   *
   * Executes endpoint generation to create comprehensive API endpoints covering
   * all requirements and entities. Each combination of path and method must be
   * unique to avoid duplicates.
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

    /** The endpoints to generate. */
    endpoints: AutoBeOpenApi.IEndpoint[] & tags.MinItems<1>;
  }
}
