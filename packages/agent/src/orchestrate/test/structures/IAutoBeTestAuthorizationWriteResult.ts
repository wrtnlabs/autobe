import {
  AutoBeOpenApi,
  AutoBeTestAuthorizationWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestAuthorizationWriteResult {
  type: "authorization";
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestArtifacts;
  function: AutoBeTestAuthorizationWriteFunction;
}
