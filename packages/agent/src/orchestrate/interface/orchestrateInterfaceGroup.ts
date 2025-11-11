import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceGroupEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceGroupHistory } from "./histories/transformInterfaceGroupHistory";
import { IAutoBeInterfaceGroupApplication } from "./structures/IAutoBeInterfaceGroupApplication";

export async function orchestrateInterfaceGroup<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
  },
): Promise<AutoBeInterfaceGroupEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBeInterfaceGroupApplication.IProps | null> = {
    value: null,
  };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "interfaceGroup",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    ...transformInterfaceGroupHistory({
      state: ctx.state(),
      instruction: props.instruction,
    }),
  });
  if (pointer.value === null) throw new Error("Failed to generate groups."); // unreachable
  return {
    type: "interfaceGroup",
    id: v7(),
    created_at: start.toISOString(),
    groups: pointer.value.groups,
    metric,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
  } satisfies AutoBeInterfaceGroupEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeInterfaceGroupApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interfaceGroup" satisfies AutoBeEventSource,
    application,
    execute: {
      makeGroups: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceGroupApplication,
  };
}

const collection = {
  chatgpt: typia.llm.application<IAutoBeInterfaceGroupApplication, "chatgpt">(),
  claude: typia.llm.application<IAutoBeInterfaceGroupApplication, "claude">(),
  gemini: typia.llm.application<IAutoBeInterfaceGroupApplication, "gemini">(),
};
