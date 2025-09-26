import { IAgenticaController } from "@agentica/core";
import { AutoBeInterfaceGroupsEvent } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceGroupHistories } from "./histories/transformInterfaceGroupHistories";
import { IAutoBeInterfaceGroupApplication } from "./structures/IAutoBeInterfaceGroupApplication";

export async function orchestrateInterfaceGroups<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    message?: string;
  },
): Promise<AutoBeInterfaceGroupsEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBeInterfaceGroupApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceGroups",
    histories: transformInterfaceGroupHistories({
      state: ctx.state(),
      instruction: props.instruction,
    }),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: props.message ?? "Design API operations for the given assets.",
  });
  if (pointer.value === null) throw new Error("Failed to generate groups."); // unreachable
  return {
    type: "interfaceGroups",
    id: v7(),
    created_at: start.toISOString(),
    groups: pointer.value.groups,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
  } satisfies AutoBeInterfaceGroupsEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeInterfaceGroupApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      makeGroups: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceGroupApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceGroupApplication,
  "claude"
>();
const chatgpt = typia.llm.application<
  IAutoBeInterfaceGroupApplication,
  "chatgpt"
>();
const collection = {
  chatgpt,
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
