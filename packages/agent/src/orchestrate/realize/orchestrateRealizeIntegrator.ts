import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { RealizeCoderOutput } from "./orchestrateRealizeCoder";

export interface RealizeIntegratorOutput {
  result: "success" | "fail" | "exception";
}

export const orchestrateRealizeIntegrator = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: RealizeCoderOutput,
): Promise<RealizeIntegratorOutput> => {
  const controllers: [string, string][] = Object.entries(
    ctx.state().interface?.files ?? {},
  ).filter(([filename]) => {
    return filename.endsWith("controller.ts");
  });

  controllers;
  return null!;
};
