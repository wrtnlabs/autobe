import { AutoBeHistory, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeConfig } from "../structures/IAutoBeConfig";
import { IAutoBeVendor } from "../structures/IAutoBeVendor";
import { AutoBeState } from "./AutoBeState";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

export interface AutoBeContext<Model extends ILlmSchema.Model> {
  model: Model;
  vendor: IAutoBeVendor;
  config: IAutoBeConfig | undefined;
  compiler: IAutoBeCompiler;
  usage: () => AutoBeTokenUsage;
  state: () => AutoBeState;
  histories: AutoBeHistory[];
}
