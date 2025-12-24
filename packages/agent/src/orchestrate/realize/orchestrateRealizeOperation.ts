import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeOperationCorrectCasting } from "./orchestrateRealizeOperationCorrectCasting";
import { orchestrateRealizeOperationCorrectOverall } from "./orchestrateRealizeOperationCorrectOverall";
import { orchestrateRealizeOperationWrite } from "./orchestrateRealizeOperationWrite";

export async function orchestrateRealizeOperation(
  ctx: AutoBeContext,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeOperationFunction[]> {
  const writes: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeOperationWrite(ctx, {
      authorizations: props.authorizations,
      collectors: props.collectors,
      transformers: props.transformers,
      progress: props.writeProgress,
    });
  const castings: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeOperationCorrectCasting(ctx, {
      authorizations: props.authorizations,
      collectors: props.collectors,
      transformers: props.transformers,
      functions: writes,
      progress: props.correctProgress,
    });
  return await orchestrateRealizeOperationCorrectOverall(ctx, {
    functions: castings,
    authorizations: props.authorizations,
    collectors: props.collectors,
    transformers: props.transformers,
    progress: props.correctProgress,
  });
}
