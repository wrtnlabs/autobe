import {
  AutoBeOpenApi,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestPrepareWriteResult {
  type: "prepare";
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestArtifacts;
  function: AutoBeTestPrepareWriteFunction;
}
