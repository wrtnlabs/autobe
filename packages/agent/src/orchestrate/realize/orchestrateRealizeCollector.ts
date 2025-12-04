import {
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCollectorCorrectCasting } from "./orchestrateRealizeCollectorCorrectCasting";
import { orchestrateRealizeCollectorCorrectOverall } from "./orchestrateRealizeCollectorCorrectOverall";
import { orchestrateRealizeCollectorPlan } from "./orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "./orchestrateRealizeCollectorWrite";

export async function orchestrateRealizeCollector<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  const plans: AutoBeRealizeCollectorPlan[] =
    await orchestrateRealizeCollectorPlan(ctx, {
      progress: props.planProgress,
    });
  const writes: AutoBeRealizeCollectorFunction[] =
    await orchestrateRealizeCollectorWrite(ctx, {
      plans,
      progress: props.writeProgress,
    });
  const castings: AutoBeRealizeCollectorFunction[] =
    await orchestrateRealizeCollectorCorrectCasting(ctx, {
      functions: writes,
      progress: props.correctProgress,
    });
  return await orchestrateRealizeCollectorCorrectOverall(ctx, {
    functions: castings,
    progress: props.correctProgress,
  });
}
