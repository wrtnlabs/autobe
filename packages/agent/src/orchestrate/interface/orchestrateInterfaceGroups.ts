import {
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceGroupsEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceGroupHistories } from "./histories/transformInterfaceGroupHistories";
import { IAutoBeInterfaceGroupApplication } from "./structures/IAutoBeInterfaceGroupApplication";

export async function orchestrateInterfaceGroups<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  content: string = "Design API operations for the given assets.",
): Promise<AutoBeAssistantMessageHistory | AutoBeInterfaceGroupsEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBeInterfaceGroupApplication.IProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "interfaceGroups",
    histories: transformInterfaceGroupHistories(ctx.state()),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: false,
  });

  const histories: MicroAgenticaHistory<Model>[] = await agentica
    .conversate(content)
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage().aggregate;
      ctx.usage().record(tokenUsage, ["interface"]);
    });
  const last: MicroAgenticaHistory<Model> = histories.at(-1)!;
  if (last.type === "assistantMessage")
    return {
      ...last,
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      id: v4(),
    } satisfies AutoBeAssistantMessageHistory;
  else if (pointer.value === null)
    throw new Error("Failed to generate groups."); // unreachable
  return {
    type: "interfaceGroups",
    created_at: start.toISOString(),
    groups: pointer.value.groups,
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
