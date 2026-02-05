import {
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeInterfaceSchemaReviewEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IJsonSchemaApplication } from "typia";

import { IAutoBeInterfaceSchemaReviewApplication } from "./IAutoBeInterfaceSchemaReviewApplication";

export interface IAutoBeInterfaceSchemaReviewConfig<
  Revise extends AutoBeInterfaceSchemaPropertyRevise,
> {
  kind: AutoBeInterfaceSchemaReviewEvent["kind"];
  systemPrompt: string;
  validate: Validator<Revise>;
  application: (
    process: Validator<Revise>,
  ) => ILlmApplication<IAutoBeInterfaceSchemaReviewApplication<Revise>>;
  jsonSchema: () => IJsonSchemaApplication<
    "3.1",
    IAutoBeInterfaceSchemaReviewApplication<Revise>
  >;
}

type Validator<Revise extends AutoBeInterfaceSchemaPropertyRevise> = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps<Revise>>;
