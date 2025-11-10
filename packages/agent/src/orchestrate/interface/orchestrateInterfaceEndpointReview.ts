import { IAgenticaController } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestratePreliminary } from "../common/orchestratePreliminary";
import { transformInterfaceEndpointReviewHistory } from "./histories/transformInterfaceEndpointReviewHistory";
import { IAutoBeInterfaceEndpointReviewApplication } from "./structures/IAutoBeInterfaceEndpointReviewApplication";

export async function orchestrateInterfaceEndpointReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const preliminary: AutoBePreliminaryController<
    "analyzeFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    keys: ["analyzeFiles", "prismaSchemas"],
    state: ctx.state(),
  });
  while (true) {
    const pointer: IPointer<IAutoBeInterfaceEndpointReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { metric, tokenUsage, histories } = await ctx.conversate({
      source: "interfaceEndpointReview",
      controller: createController({
        preliminary,
        model: ctx.model,
        build: (props) => {
          pointer.value = props;
        },
      }),
      enforceFunctionCall: true,
      ...transformInterfaceEndpointReviewHistory({
        preliminary,
        endpoints,
      }),
    });
    if (pointer.value !== null) {
      const response: AutoBeOpenApi.IEndpoint[] =
        pointer.value?.endpoints ?? [];
      ctx.dispatch({
        id: v7(),
        type: "interfaceEndpointReview",
        endpoints,
        content: response,
        created_at: new Date().toISOString(),
        review: pointer.value?.review,
        step: ctx.state().analyze?.step ?? 0,
        metric,
        tokenUsage,
      });
      return response;
    } else
      await orchestratePreliminary(ctx, {
        type: "interfaceEndpointReview",
        histories,
        preliminary,
      });
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">;
  build: (props: IAutoBeInterfaceEndpointReviewApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    props.preliminary,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      reviewEndpoints: (next) => {
        props.build(next);
      },
      analyzeFiles: () => {},
      prismaSchemas: () => {},
    } satisfies IAutoBeInterfaceEndpointReviewApplication,
  };
}

const collection = {
  chatgpt: (
    preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">,
  ) =>
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication, "chatgpt">(
      {
        validate: preliminary.createValidate(),
      },
    ),
  claude: (
    preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">,
  ) =>
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication, "claude">({
      validate: preliminary.createValidate(),
    }),
  gemini: (
    preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">,
  ) =>
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication, "gemini">({
      validate: preliminary.createValidate(),
    }),
};
