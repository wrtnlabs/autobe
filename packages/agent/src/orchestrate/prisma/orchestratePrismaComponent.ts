import { IAgenticaController } from "@agentica/core";
import { AutoBePrismaComponentEvent } from "@autobe/interface/src/events/AutoBePrismaComponentEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaComponentsHistories } from "./histories/transformPrismaComponentsHistories";
import { IAutoBePrismaComponentApplication } from "./structures/IAutoBePrismaComponentApplication";

export async function orchestratePrismaComponents<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  instruction: string,
  message: string = "Design database from the given requirement analysis documents.",
): Promise<AutoBePrismaComponentEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBePrismaComponentApplication.IProps | null> = {
    value: null,
  };
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const { metric, tokenUsage } = await ctx.conversate({
    source: "prismaComponent",
    histories: transformPrismaComponentsHistories(ctx.state(), {
      prefix,
      instruction,
    }),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message,
  });
  if (pointer.value === null)
    throw new Error("Failed to extract files and tables."); // unreachable
  return {
    type: "prismaComponent",
    id: v7(),
    created_at: start.toISOString(),
    thinking: pointer.value.thinking,
    review: pointer.value.review,
    decision: pointer.value.decision,
    components: pointer.value.components,
    metric,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
  };
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBePrismaComponentApplication.IProps) => void;
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
    name: "Prisma Extract Files and Tables",
    application,
    execute: {
      extractComponents: (next) => {
        props.build(next);
      },
    } satisfies IAutoBePrismaComponentApplication,
  };
}

const collection = {
  chatgpt: typia.llm.application<
    IAutoBePrismaComponentApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBePrismaComponentApplication,
    "claude"
  >(),
  gemini: typia.llm.application<
    IAutoBePrismaComponentApplication,
    "gemini"
  >(),
};
