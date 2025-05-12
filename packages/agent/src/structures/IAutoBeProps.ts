import { AutoBeHistory, IAutoBeCompiler } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeConfig } from "./IAutoBeConfig";
import { IAutoBeVendor } from "./IAutoBeVendor";

export interface IAutoBeProps<Model extends ILlmSchema.Model> {
  model: Model;
  vendor: IAutoBeVendor;
  compiler: IAutoBeCompiler;
  histories?: AutoBeHistory[] | undefined;
  config?: IAutoBeConfig | undefined;
}
