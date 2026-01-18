import {
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeTransformerCorrectCasting } from "./orchestrateRealizeTransformerCorrectCasting";
import { orchestrateRealizeTransformerCorrectOverall } from "./orchestrateRealizeTransformerCorrectOverall";
import { orchestrateRealizeTransformerPlan } from "./orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "./orchestrateRealizeTransformerWrite";

export async function orchestrateRealizeTransformer(
  ctx: AutoBeContext,
  props: {
    planProgress: AutoBeProgressEventBase;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  const plans: AutoBeRealizeTransformerPlan[] =
    await orchestrateRealizeTransformerPlan(ctx, {
      progress: props.planProgress,
    });
  let functions: AutoBeRealizeTransformerFunction[] =
    await orchestrateRealizeTransformerWrite(ctx, {
      plans,
      progress: props.writeProgress,
    });
  functions = await orchestrateRealizeTransformerCorrectCasting(ctx, {
    functions,
    progress: props.correctProgress,
  });
  functions = await orchestrateRealizeTransformerCorrectOverall(ctx, {
    functions,
    progress: props.correctProgress,
  });
  return functions;
}
