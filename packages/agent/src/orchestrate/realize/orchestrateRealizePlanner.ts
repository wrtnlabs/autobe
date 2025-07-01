import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";

export interface RealizePlannerOutput {}

export const orchestrateRealizePlanner = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operation: AutoBeOpenApi.IOperation,
): Promise<RealizePlannerOutput> => {
  ctx;
  return null!;
};
