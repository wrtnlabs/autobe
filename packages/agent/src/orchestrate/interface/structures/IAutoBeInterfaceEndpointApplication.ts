import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

export interface IAutoBeInterfaceEndpointApplication {
  /**
   * Create Restful API endpoints.
   *
   * Create Restful API endpoints referencing the given documents; requirement
   * analysis documents, and Prisma schema files with ERD descriptions. The API
   * endpoints must cover every requirements and every entities in the ERD.
   *
   * Also, each combination of {@link AutoBeOpenApi.IEndpoint.path} and
   * {@link AutoBeOpenApi.IEndpoint.method} must be unique to avoid duplicates.
   * Please don't make any duplicates.
   *
   * @param props Properties containing the endpoints
   */
  makeEndpoints(props: IAutoBeInterfaceEndpointApplication.IProps): void;
}
export namespace IAutoBeInterfaceEndpointApplication {
  export interface IProps {
    /** The endpoints to generate. */
    endpoints: AutoBeOpenApi.IEndpoint[] & tags.MinItems<1>;
  }
}
