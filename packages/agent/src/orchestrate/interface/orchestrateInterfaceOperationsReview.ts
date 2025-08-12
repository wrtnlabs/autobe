import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceOperationsReviewHistories } from "./histories/transformInterfaceOperationsReviewHistories";
import { IAutoBeInterfaceOperationsReviewApplication } from "./structures/IAutoBeInterfaceOperationsReviewApplication";

export async function orchestrateInterfaceOperationsReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
): Promise<AutoBeOpenApi.IOperation[]> {
  const pointer: IPointer<IAutoBeInterfaceOperationsReviewApplication.IProps | null> =
    {
      value: null,
    };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "interfaceOperationsReview",
    histories: transformInterfaceOperationsReviewHistories(ctx, operations),
    controller: createReviewController({
      model: ctx.model,
      build: (next: IAutoBeInterfaceOperationsReviewApplication.IProps) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: false,
  });
  await agentica.conversate("Review the operations").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["interface"]);
  });

  if (pointer.value === null) throw new Error("Failed to review operations.");
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
