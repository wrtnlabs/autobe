import { AutoBeOpenApi, AutoBeTestAuthorizeFunction } from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestAuthorizeProcedure {
  type: "authorize";
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestArtifacts;
  function: AutoBeTestAuthorizeFunction;
}
