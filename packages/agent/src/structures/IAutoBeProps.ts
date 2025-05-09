import { AutoBeHistory } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeConfig } from "./IAutoBeConfig";
import { IAutoBeVendor } from "./IAutoBeVendor";

export interface IAutoBeProps<Model extends ILlmSchema.Model> {
  model: Model;
  vendor: IAutoBeVendor;
  histories?: AutoBeHistory[] | undefined;
  config?: IAutoBeConfig | undefined;
}
