import {
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectWithRetry } from "./correct/orchestrateRealizeCorrectWithRetry";
import { orchestrateRealizeCollectorCorrectCasting } from "./orchestrateRealizeCollectorCorrectCasting";
import { orchestrateRealizeCollectorCorrectOverall } from "./orchestrateRealizeCollectorCorrectOverall";
import { orchestrateRealizeCollectorPlan } from "./orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "./orchestrateRealizeCollectorWrite";

export async function orchestrateRealizeCollector(
  ctx: AutoBeContext,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  const plans: AutoBeRealizeCollectorPlan[] =
    await orchestrateRealizeCollectorPlan(ctx, {
      progress: props.planProgress,
    });
  return orchestrateRealizeCorrectWithRetry({
    write: () =>
      orchestrateRealizeCollectorWrite(ctx, {
        plans,
        progress: props.writeProgress,
      }),
    rewrite: (failed) =>
      orchestrateRealizeCollectorWrite(ctx, {
        plans: failed.map((f) => f.plan),
        progress: props.writeProgress,
      }),
    correctCasting: (functions) =>
      orchestrateRealizeCollectorCorrectCasting(ctx, {
        functions,
        progress: props.validateProgress,
      }),
    correctOverall: (functions) =>
      orchestrateRealizeCollectorCorrectOverall(ctx, {
        functions,
        progress: props.validateProgress,
      }),
    addProgress: (count) => {
      props.validateProgress.total += count;
    },
  });
}
