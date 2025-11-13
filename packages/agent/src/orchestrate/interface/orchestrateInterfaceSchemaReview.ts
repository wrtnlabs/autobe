import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfaceSchemaReviewEvent } from "@autobe/interface/src/events/AutoBeInterfaceSchemaReviewEvent";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceSchemaReviewHistory } from "./histories/transformInterfaceSchemaReviewHistory";
import { IAutoBeInterfaceSchemaContentReviewApplication } from "./structures/IAutoBeInterfaceSchemaContentReviewApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

interface IConfig {
  kind: AutoBeInterfaceSchemaReviewEvent["kind"];
  systemPrompt: string;
}

export async function orchestrateInterfaceSchemaReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  config: IConfig,
  props: {
    document: AutoBeOpenApi.IDocument;
    instruction: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const typeNames: string[] = Object.keys(props.document.components.schemas);
  const matrix: string[][] = divideArray({
    array: typeNames,
    capacity: AutoBeConfigConstant.INTERFACE_CAPACITY,
  });
  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const y of await executeCachedBatch(
    matrix.map((it) => async (promptCacheKey) => {
      const reviewOperations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && it.includes(op.requestBody.typeName)) ||
            (op.responseBody && it.includes(op.responseBody.typeName)),
        );
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, config, {
          instruction: props.instruction,
          document: props.document,
          reviewOperations,
          reviewSchemas: it.reduce(
            (acc, cur) => {
              acc[cur] = props.document.components.schemas[cur];
              return acc;
            },
            {} as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
          ),
          progress: props.progress,
          promptCacheKey,
        });
      return row;
    }),
  )) {
    JsonSchemaNamingConvention.schemas(props.document.operations, x, y);
    Object.assign(x, y);
  }
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  config: IConfig,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    reviewOperations: AutoBeOpenApi.IOperation[];
    reviewSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  try {
    return await process(ctx, config, props);
  } catch {
    ++props.progress.completed;
    return {};
  }
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  config: IConfig,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    reviewOperations: AutoBeOpenApi.IOperation[];
    reviewSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaContentReviewApplication>(),
    source: "interfaceSchemaReview",
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "interfaceOperations",
      "interfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      interfaceOperations: props.reviewOperations,
      interfaceSchemas: props.reviewSchemas,
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceSchemaContentReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "interfaceSchemaReview",
      controller: createController({
        preliminary,
        pointer,
        model: ctx.model,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaReviewHistory({
        state: ctx.state(),
        systemPrompt: config.systemPrompt,
        instruction: props.instruction,
        reviewOperations: props.reviewOperations,
        reviewSchemas: props.reviewSchemas,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      const content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
        OpenApiV3_1Emender.convertComponents({
          schemas: pointer.value.content,
        }) as AutoBeOpenApi.IComponents
      ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      ctx.dispatch({
        type: "interfaceSchemaReview",
        kind: config.kind,
        id: v7(),
        schemas: props.reviewSchemas,
        review: pointer.value.think.review,
        plan: pointer.value.think.plan,
        content,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        step: ctx.state().analyze?.step ?? 0,
        total: props.progress.total,
        completed: ++props.progress.completed,
        created_at: new Date().toISOString(),
      });
      return out(result)(content);
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemaContentReviewApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  >;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaContentReviewApplication.IProps> => {
    if (
      typia.is<{
        request: {
          type: "complete";
          schemas: object;
        };
      }>(next)
    )
      JsonSchemaFactory.fixPage("content", next.request);

    const result: IValidation<IAutoBeInterfaceSchemaContentReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaContentReviewApplication.IProps>(
        next,
      );
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        request: result.data.request,
      }) as any;

    const errors: IValidation.IError[] = [];
    JsonSchemaValidator.validateSchemas({
      errors,
      schemas: result.data.request.content,
      path: "$input.request.content",
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
    return result;
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
    name: "interfaceSchemaReview" satisfies AutoBeEventSource,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceSchemaContentReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaContentReviewApplication,
      "chatgpt"
    >({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaContentReviewApplication,
      "claude"
    >({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaContentReviewApplication,
      "gemini"
    >({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaContentReviewApplication.IProps>;
