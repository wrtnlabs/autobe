import {
  AutoBeOpenApi,
  AutoBeTestGenerateWriteFunction,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestGenerateWriteResult {
  type: "generate";
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestArtifacts;
  prepareFunction: AutoBeTestPrepareWriteFunction;
  function: AutoBeTestGenerateWriteFunction;
}
