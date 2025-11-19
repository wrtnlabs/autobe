import { IAgenticaController } from "@agentica/core";
import { AutoBeEventSource, AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceEndpointReviewHistory } from "./histories/transformInterfaceEndpointReviewHistory";
import { IAutoBeInterfaceEndpointReviewApplication } from "./structures/IAutoBeInterfaceEndpointReviewApplication";

export async function orchestrateInterfaceEndpointReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceEndpointReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async () => {
    const pointer: IPointer<IAutoBeInterfaceEndpointReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
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
    const out = (value: AutoBeOpenApi.IEndpoint[] | null) => ({
      ...result,
      value,
    });
    if (pointer.value !== null) {
      const response: AutoBeOpenApi.IEndpoint[] =
        pointer.value?.endpoints ?? [];
      ctx.dispatch({
        id: v7(),
        type: SOURCE,
        endpoints,
        content: response,
        created_at: new Date().toISOString(),
        review: pointer.value?.review,
        step: ctx.state().analyze?.step ?? 0,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
      });
      return out(response);
    }
    return out(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  preliminary: AutoBePreliminaryController<"analysisFiles" | "prismaSchemas">;
  build: (props: IAutoBeInterfaceEndpointReviewApplication.IComplete) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeInterfaceEndpointReviewApplication.IProps>(input);
    if (result.success === false || result.data.request.type === "complete")
      return result;
    return props.preliminary.validate({
      thinking: result.data.thinking,
      request: result.data.request,
    });
  };

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceEndpointReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication, "chatgpt">(
      {
        validate: {
          process: validate,
        },
      },
    ),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceEndpointReviewApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceEndpointReviewApplication.IProps>;

const SOURCE = "interfaceEndpointReview" satisfies AutoBeEventSource;
