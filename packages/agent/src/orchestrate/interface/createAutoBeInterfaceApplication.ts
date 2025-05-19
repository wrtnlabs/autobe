import { IAgenticaController } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { assertSchemaModel } from "../../context/assertSchemaModel";
import { IAutoBeInterfaceApplication } from "./IAutoBeInterfaceApplication";
import { validateInterfaceProps } from "./validateInterfaceProps";

export const createAutoBeInterfaceApplication = <
  Model extends ILlmSchema.Model,
>(props: {
  model: Model;
  build: (props: IAutoBeInterfaceApplication.IProps) => Promise<void>;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  application.functions[0].validate = validateInterfaceProps;

  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      interface: async (next) => {
        await props.build(next);
        return {
          success: true,
        };
      },
    } satisfies IAutoBeInterfaceApplication,
  };
};

const claude = typia.llm.application<
  IAutoBeInterfaceApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IAutoBeInterfaceApplication, "3.0">(),
};
