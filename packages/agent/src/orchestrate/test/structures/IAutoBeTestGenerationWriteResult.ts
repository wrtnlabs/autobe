import {
  AutoBeTestWriteGenerationFunction,
  AutoBeTestWritePrepareFunction,
} from "@autobe/interface";

import { IAutoBeTestArtifacts } from "./IAutoBeTestArtifacts";

export interface IAutoBeTestGenerationWriteResult {
  type: "generation";
  artifacts: IAutoBeTestArtifacts;
  prepareFunction: AutoBeTestWritePrepareFunction;
  function: AutoBeTestWriteGenerationFunction;
}
