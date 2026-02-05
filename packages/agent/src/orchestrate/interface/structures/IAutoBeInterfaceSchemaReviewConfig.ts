import {
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeInterfaceSchemaReviewEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";

import { IAutoBeInterfaceSchemaReviewApplication } from "./IAutoBeInterfaceSchemaReviewApplication";

export interface IAutoBeInterfaceSchemaReviewConfig<
  Revise extends AutoBeInterfaceSchemaPropertyRevise,
> {
  kind: AutoBeInterfaceSchemaReviewEvent["kind"];
  systemPrompt: string;
  application: (
    validator: Validator<Revise>,
  ) => ILlmApplication<IAutoBeInterfaceSchemaReviewApplication<Revise>>;
}

type Validator<Revise extends AutoBeInterfaceSchemaPropertyRevise> = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps<Revise>>;
