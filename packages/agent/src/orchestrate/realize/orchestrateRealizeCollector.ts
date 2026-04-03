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
    validateProgress: AutoBeProgressEventBase;
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
  props.validateProgress.total += functions.length;

  functions = await orchestrateRealizeCollectorCorrectCasting(ctx, {
    functions,
    progress: props.validateProgress,
  });
  functions = await orchestrateRealizeCollectorCorrectOverall(ctx, {
    functions,
    progress: props.validateProgress,
  });
  return functions;
}
