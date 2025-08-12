import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeInterfaceSchemasReviewEvent,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceSchemasReviewHistories } from "./histories/transformInterfaceSchemasReviewHistories";
import { IAutoBeInterfaceSchemasReviewApplication } from "./structures/IAutobeInterfaceSchemasReviewApplication";

export async function orchestrateInterfaceSchemasReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  schemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
  progress: { total: number; completed: number },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null> =
    {
      value: null,
    };

  const agent: MicroAgentica<Model> = ctx.createAgent({
    source: "interfaceSchemasReview",
    controller: createController({
      model: ctx.model,
      pointer,
    }),
    histories: transformInterfaceSchemasReviewHistories(ctx.state(), schemas),
    enforceFunctionCall: true,
  });

  const command = `review about given schemas.` as const;
  await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["interface"]);
  });

  if (pointer.value === null)
    throw new Error("Failed to extract review information.");

  const event: AutoBeInterfaceSchemasReviewEvent = {
    type: "interfaceSchemasReview",
    schemas: schemas,
    plan: pointer.value.plan,
    review: pointer.value.review,
    content: pointer.value.content,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
    total: progress.total,
    completed: ++progress.completed,
  };
  ctx.dispatch(event);

  return pointer.value.content;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null>;
}): IAgenticaController.IClass<Model> {
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Reviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeInterfaceSchemasReviewApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceSchemasReviewApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceSchemasReviewApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
