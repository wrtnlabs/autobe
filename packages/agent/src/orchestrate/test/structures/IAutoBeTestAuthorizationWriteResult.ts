import { AutoBeTestWriteAuthorizationFunction } from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestAuthorizationWriteResult {
  type: "authorization";
  artifacts: IAutoBeTestArtifacts;
  function: AutoBeTestWriteAuthorizationFunction;
}
