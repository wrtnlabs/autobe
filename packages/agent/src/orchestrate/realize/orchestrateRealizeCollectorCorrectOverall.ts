import {
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectOverall } from "./internal/orchestrateRealizeCorrectOverall";

export const orchestrateRealizeCollectorCorrectOverall = <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    functions: AutoBeRealizeCollectorFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> =>
  orchestrateRealizeCorrectOverall(ctx, {
    programmer: {},
    functions: props.functions,
    progress: props.progress,
  });
