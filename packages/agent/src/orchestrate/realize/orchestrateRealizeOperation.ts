import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeOperationCorrectCasting } from "./orchestrateRealizeOperationCorrectCasting";
import { orchestrateRealizeOperationWrite } from "./orchestrateRealizeOperationWrite";

export async function orchestrateRealizeOperation(
  ctx: AutoBeContext,
  props: {
    authorizations: AutoBeRealizeAuthorization[];
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
    writeProgress: AutoBeProgressEventBase;
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeOperationFunction[]> {
  let functions: AutoBeRealizeOperationFunction[] =
    await orchestrateRealizeOperationWrite(ctx, {
      authorizations: props.authorizations,
      collectors: props.collectors,
      transformers: props.transformers,
      progress: props.writeProgress,
    });
  props.validateProgress.total += functions.length;

  functions = await orchestrateRealizeOperationCorrectCasting(ctx, {
    authorizations: props.authorizations,
    collectors: props.collectors,
    transformers: props.transformers,
    functions,
    progress: props.validateProgress,
  });
  return functions;
}
