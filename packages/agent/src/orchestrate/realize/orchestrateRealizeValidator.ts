import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { RealizeCoderOutput } from "./orchestrateRealizeCoder";

export interface RealizeValidatorOutput {
  location: string;
  content: string;
  result: "success" | "fail" | "exception";
}

export const orchestrateRealizeValidator = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: RealizeCoderOutput,
): Promise<RealizeValidatorOutput> => {
  ctx;
  return null!;
};
