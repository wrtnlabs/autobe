import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { RealizePlannerOutput } from "./orchestrateRealizePlanner";

export interface RealizeCoderOutput {}

export const orchestrateRealizeCoder = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: RealizePlannerOutput,
): Promise<RealizeCoderOutput> => {
  ctx;
  return null!;
};
