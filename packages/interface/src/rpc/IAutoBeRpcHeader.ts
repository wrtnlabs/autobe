import { ILlmSchema } from "@samchon/openapi";

import { IAutoBeRpcVendor } from "./IAutoBeRpcVendor";

export interface IAutoBeRpcHeader<Model extends ILlmSchema.Model> {
  model: Model;
  vendor: IAutoBeRpcVendor;
  locale: string;
  timezone: string;
}
