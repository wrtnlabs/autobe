import { IAgenticaController } from "@agentica/core";
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
  operations: AutoBeOpenApi.IOperation[],
  schemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >,
  progress: { total: number; completed: number },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  try {
    const pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceSchemasReview",
      controller: createController({
        model: ctx.model,
        pointer,
        schemas,
      }),
      histories: transformInterfaceSchemasReviewHistories(
        ctx.state(),
        operations,
        schemas,
      ),
      enforceFunctionCall: true,
      message: "Review type schemas.",
    });
    if (pointer.value === null) {
      console.error("Failed to extract review information.");
      ++progress.completed;
      return {};
    }

    ctx.dispatch({
      type: "interfaceSchemasReview",
      schemas: schemas,
      review: pointer.value.review,
      plan: pointer.value.plan,
      content: pointer.value.content,
      tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: progress.total,
      completed: ++progress.completed,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemasReviewEvent);
    return pointer.value.content;
  } catch (error) {
    console.error("Error occurred during interface schemas review:", error);
    ++progress.completed;
    return {};
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null>;
  schemas: Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
  >;
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
