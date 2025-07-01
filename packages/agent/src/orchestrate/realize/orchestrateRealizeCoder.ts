import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { RealizePlannerOutput } from "./orchestrateRealizePlanner";

interface RealizeCoderOutput {}

export const orchestrateRealizeCoder = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  plan: RealizePlannerOutput,
): Promise<RealizeCoderOutput> => {
  ctx;
  return null!;
};
