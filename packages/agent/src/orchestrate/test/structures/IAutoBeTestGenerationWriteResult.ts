import {
  AutoBeTestGenerationWriteFunction,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestGenerationWriteResult {
  type: "generation";
  artifacts: IAutoBeTestArtifacts;
  prepareFunction: AutoBeTestPrepareWriteFunction;
  function: AutoBeTestGenerationWriteFunction;
}
