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
  let functions: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeOperationWrite(ctx, {
      authorizations: props.authorizations,
      collectors: props.collectors,
      transformers: props.transformers,
      progress: props.writeProgress,
    });
  functions = await orchestrateRealizeOperationCorrectCasting(ctx, {
    authorizations: props.authorizations,
    collectors: props.collectors,
    transformers: props.transformers,
    functions,
    progress: props.correctProgress,
  });
  functions = await orchestrateRealizeOperationCorrectOverall(ctx, {
    functions,
    authorizations: props.authorizations,
    collectors: props.collectors,
    transformers: props.transformers,
    progress: props.correctProgress,
  });
  return functions;
}
