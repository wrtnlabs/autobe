import { AutoBeOpenApi, AutoBeTestAuthorizeFunction } from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestAuthorizeWriteResult {
  type: "authorize";
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestArtifacts;
  function: AutoBeTestAuthorizeFunction;
}
