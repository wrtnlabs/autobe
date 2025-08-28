import { IAgenticaController } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceEndpointsReviewHistories } from "./histories/transformInterfaceEndpointsReviewHistories";
import { IAutoBeInterfaceEndpointsReviewApplication } from "./structures/IAutoBeInterfaceEndpointsReviewApplication";

export async function orchestrateInterfaceEndpointsReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  message: string = `Review the generated endpoints`,
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const pointer: IPointer<IAutoBeInterfaceEndpointsReviewApplication.IProps | null> =
    {
      value: null,
    };

  const { tokenUsage } = await ctx.conversate({
    source: "interfaceEndpointsReview",
    histories: transformInterfaceEndpointsReviewHistories(
      ctx.state(),
      endpoints,
    ),
    controller: createController({
      model: ctx.model,
      build: (props) => {
        pointer.value = props;
      },
    }),
    enforceFunctionCall: true,
    message,
  });

  if (pointer.value === null) {
    return endpoints;
  }

  const response = pointer.value?.endpoints ?? [];

  ctx.dispatch({
    id: v7(),
    type: "interfaceEndpointsReview",
    endpoints,
    content: response,
    created_at: new Date().toISOString(),
    review: pointer.value?.review,
    step: ctx.state().analyze?.step ?? 0,
    tokenUsage,
  });

  return response;
}

export function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (props: IAutoBeInterfaceEndpointsReviewApplication.IProps) => void;
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
      reviewEndpoints: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceEndpointsReviewApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceEndpointsReviewApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceEndpointsReviewApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
