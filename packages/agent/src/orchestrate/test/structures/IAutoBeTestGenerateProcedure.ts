import {
  AutoBeOpenApi,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestGenerateProcedure {
  type: "generate";
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestArtifacts;
  prepare: AutoBeTestPrepareFunction;
  function: AutoBeTestGenerateFunction;
}
