import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeOperationFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectWithRetry } from "./correct/orchestrateRealizeCorrectWithRetry";
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
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeOperationFunction[]> {
  return orchestrateRealizeCorrectWithRetry({
    write: () =>
      orchestrateRealizeOperationWrite(ctx, {
        authorizations: props.authorizations,
        collectors: props.collectors,
        transformers: props.transformers,
        progress: props.writeProgress,
      }),
    rewrite: (failed) =>
      orchestrateRealizeOperationWrite(ctx, {
        authorizations: props.authorizations,
        collectors: props.collectors,
        transformers: props.transformers,
        progress: props.writeProgress,
        targetEndpoints: failed.map((f) => f.endpoint),
      }),
    correctCasting: (functions) =>
      orchestrateRealizeOperationCorrectCasting(ctx, {
        authorizations: props.authorizations,
        collectors: props.collectors,
        transformers: props.transformers,
        functions,
        progress: props.validateProgress,
      }),
    correctOverall: (functions) =>
      orchestrateRealizeOperationCorrectOverall(ctx, {
        functions,
        authorizations: props.authorizations,
        collectors: props.collectors,
        transformers: props.transformers,
        progress: props.validateProgress,
      }),
    addProgress: (count) => {
      props.validateProgress.total += 2 * count;
    },
  });
}
