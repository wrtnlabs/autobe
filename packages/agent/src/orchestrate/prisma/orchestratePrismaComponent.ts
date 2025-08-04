import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import { AutoBeAssistantMessageHistory } from "@autobe/interface";
import { AutoBePrismaComponentsEvent } from "@autobe/interface/src/events/AutoBePrismaComponentsEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaComponentsHistories } from "./histories/transformPrismaComponentsHistories";
import { IAutoBePrismaComponentApplication } from "./structures/IAutoBePrismaComponentApplication";

export async function orchestratePrismaComponents<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  content: string = "Please extract files and tables from the given documents.",
): Promise<AutoBeAssistantMessageHistory | AutoBePrismaComponentsEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBePrismaComponentApplication.IProps | null> = {
    value: null,
  };
  const prefix: string | null = ctx.state().analyze?.prefix ?? null;
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
    histories: transformPrismaComponentsHistories(ctx.state(), prefix),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });

  const histories: MicroAgenticaHistory<Model>[] = await agentica
    .conversate(content)
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage().aggregate;
      ctx.usage().record(tokenUsage, ["prisma"]);
    });
  if (histories.at(-1)?.type === "assistantMessage")
    return {
      ...(histories.at(-1)! as AgenticaAssistantMessageHistory),
      created_at: start.toISOString(),
      completed_at: new Date().toISOString(),
      id: v4(),
    } satisfies AutoBeAssistantMessageHistory;
  else if (pointer.value === null) {
    throw new Error("Failed to extract files and tables."); // unreachable
  }
  return {
    type: "prismaComponents",
    created_at: start.toISOString(),
    thinking: pointer.value.thinking,
    review: pointer.value.review,
    decision: pointer.value.decision,
    components: pointer.value.components,
    step: ctx.state().analyze?.step ?? 0,
  };
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBePrismaComponentApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
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

const claude = typia.llm.application<
  IAutoBePrismaComponentApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBePrismaComponentApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
