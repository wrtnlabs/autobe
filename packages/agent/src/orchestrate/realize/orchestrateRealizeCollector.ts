import {
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCollectorCorrectCasting } from "./orchestrateRealizeCollectorCorrectCasting";
import { orchestrateRealizeCollectorCorrectOverall } from "./orchestrateRealizeCollectorCorrectOverall";
import { orchestrateRealizeCollectorPlan } from "./orchestrateRealizeCollectorPlan";
import { orchestrateRealizeCollectorWrite } from "./orchestrateRealizeCollectorWrite";

export async function orchestrateRealizeCollector(
  ctx: AutoBeContext,
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
  let functions: AutoBeRealizeCollectorFunction[] =
    await orchestrateRealizeCollectorWrite(ctx, {
      plans,
      progress: props.writeProgress,
    });
  functions = await orchestrateRealizeCollectorCorrectOverall(ctx, {
    functions,
    progress: props.correctProgress,
  });
  functions = await orchestrateRealizeCollectorCorrectCasting(ctx, {
    functions,
    progress: props.correctProgress,
  });
  return functions;
}
