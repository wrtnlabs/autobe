import { AutoBeTestPrepareWriteFunction } from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestPrepareWriteResult {
  type: "prepare";
  artifacts: IAutoBeTestArtifacts;
  function: AutoBeTestPrepareWriteFunction;
}
