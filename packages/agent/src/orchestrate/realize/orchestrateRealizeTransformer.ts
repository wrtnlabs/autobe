import {
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectWithRetry } from "./correct/orchestrateRealizeCorrectWithRetry";
import { orchestrateRealizeTransformerCorrectCasting } from "./orchestrateRealizeTransformerCorrectCasting";
import { orchestrateRealizeTransformerCorrectOverall } from "./orchestrateRealizeTransformerCorrectOverall";
import { orchestrateRealizeTransformerPlan } from "./orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "./orchestrateRealizeTransformerWrite";

export async function orchestrateRealizeTransformer(
  ctx: AutoBeContext,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  const plans: AutoBeRealizeTransformerPlan[] =
    await orchestrateRealizeTransformerPlan(ctx, {
      progress: props.planProgress,
    });
  return orchestrateRealizeCorrectWithRetry({
    write: () =>
      orchestrateRealizeTransformerWrite(ctx, {
        plans,
        progress: props.writeProgress,
      }),
    rewrite: (failed) =>
      orchestrateRealizeTransformerWrite(ctx, {
        plans: failed.map((f) => f.plan),
        progress: props.writeProgress,
      }),
    correctCasting: (functions) =>
      orchestrateRealizeTransformerCorrectCasting(ctx, {
        functions,
        progress: props.validateProgress,
      }),
    correctOverall: (functions) =>
      orchestrateRealizeTransformerCorrectOverall(ctx, {
        functions,
        progress: props.validateProgress,
      }),
    addProgress: (count) => {
      props.validateProgress.total += count;
    },
  });
}
