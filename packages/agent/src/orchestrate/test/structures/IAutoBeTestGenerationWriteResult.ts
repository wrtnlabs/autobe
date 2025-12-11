import {
  AutoBeOpenApi,
  AutoBeTestGenerationWriteFunction,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestGenerationWriteResult {
  type: "generation";
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestArtifacts;
  prepareFunction: AutoBeTestPrepareWriteFunction;
  function: AutoBeTestGenerationWriteFunction;
}
