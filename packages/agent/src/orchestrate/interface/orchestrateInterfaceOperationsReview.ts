import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceOperationsReviewEvent,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IProgress } from "../internal/IProgress";
import { transformInterfaceOperationsReviewHistories } from "./histories/transformInterfaceOperationsReviewHistories";
import { IAutoBeInterfaceOperationsReviewApplication } from "./structures/IAutoBeInterfaceOperationsReviewApplication";

export async function orchestrateInterfaceOperationsReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  progress: IProgress,
): Promise<AutoBeOpenApi.IOperation[]> {
  const pointer: IPointer<IAutoBeInterfaceOperationsReviewApplication.IProps | null> =
    {
      value: null,
    };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceOperationsReview",
    histories: transformInterfaceOperationsReviewHistories(ctx, operations),
    controller: createReviewController({
      model: ctx.model,
      build: (next: IAutoBeInterfaceOperationsReviewApplication.IProps) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: false,
    message: "Review the operations",
  });
  if (pointer.value === null) throw new Error("Failed to review operations.");

  ctx.dispatch({
    type: "interfaceOperationsReview",
    operations: pointer.value.content,
    review: pointer.value.review,
    plan: pointer.value.plan,
    content: pointer.value.content,
    tokenUsage,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
    total: progress.total,
    completed: ++progress.completed,
  } satisfies AutoBeInterfaceOperationsReviewEvent);
  return pointer.value.content;
}

function createReviewController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (reviews: IAutoBeInterfaceOperationsReviewApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "review",
    application,
    execute: {
      reviewOperations: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceOperationsReviewApplication,
  };
}

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceOperationsReviewApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBeInterfaceOperationsReviewApplication,
    "claude"
  >(),
};
