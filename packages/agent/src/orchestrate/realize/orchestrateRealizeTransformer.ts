import {
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeTransformerCorrectCasting } from "./orchestrateRealizeTransformerCorrectCasting";
import { orchestrateRealizeTransformerCorrectOverall } from "./orchestrateRealizeTransformerCorrectOverall";
import { orchestrateRealizeTransformerPlan } from "./orchestrateRealizeTransformerPlan";
import { orchestrateRealizeTransformerWrite } from "./orchestrateRealizeTransformerWrite";

export async function orchestrateRealizeTransformer<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
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
  const writes: AutoBeRealizeTransformerFunction[] =
    await orchestrateRealizeTransformerWrite(ctx, {
      plans,
      progress: props.writeProgress,
    });
  const castings: AutoBeRealizeTransformerFunction[] =
    await orchestrateRealizeTransformerCorrectCasting(ctx, {
      functions: writes,
      progress: props.correctProgress,
    });
  return await orchestrateRealizeTransformerCorrectOverall(ctx, {
    functions: castings,
    progress: props.correctProgress,
  });
}
