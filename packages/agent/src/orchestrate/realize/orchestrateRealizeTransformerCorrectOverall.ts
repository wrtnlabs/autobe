import {
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectOverall } from "./internal/orchestrateRealizeCorrectOverall";

export const orchestrateRealizeTransformerCorrectOverall = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    functions: AutoBeRealizeTransformerFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> =>
  orchestrateRealizeCorrectOverall(ctx, {
    programmer: {},
    functions: props.functions,
    progress: props.progress,
  });
