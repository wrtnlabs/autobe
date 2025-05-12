import { IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeVendor } from "../structures/IAutoBeVendor";
import { AutoBeState } from "./AutoBeState";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

export interface AutoBeContext<Model extends ILlmSchema.Model> {
  model: Model;
  vendor: IAutoBeVendor;
  compiler: IAutoBeCompiler;
  usage: () => AutoBeTokenUsage;
  state: () => AutoBeState;
}
