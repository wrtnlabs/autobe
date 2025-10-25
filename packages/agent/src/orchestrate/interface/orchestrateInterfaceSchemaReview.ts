import { IAgenticaController } from "@agentica/core";
import { AutoBeOpenApi, AutoBeProgressEventBase } from "@autobe/interface";
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
import { transformInterfaceSchemaReviewHistories } from "./histories/transformInterfaceSchemaReviewHistories";
import { IAutoBeInterfaceSchemaContentReviewApplication } from "./structures/IAutoBeInterfaceSchemaContentReviewApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

interface IConfig {
  type:
    | "interfaceSchemaContentReview"
    | "interfaceSchemaSecurityReview"
    | "interfaceSchemaRelationReview";
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
  },
  capacity: number = AutoBeConfigConstant.INTERFACE_CAPACITY,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const typeNames: string[] = Object.keys(props.document.components.schemas);
  const matrix: string[][] = divideArray({
    array: typeNames,
    capacity,
  });
  const progress: AutoBeProgressEventBase = {
    total: matrix.length,
    completed: 0,
  };

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const y of await executeCachedBatch(
    matrix.map((it) => async (promptCacheKey) => {
      const operations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && it.includes(op.requestBody.typeName)) ||
            (op.responseBody && it.includes(op.responseBody.typeName)),
        );
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, config, {
          instruction: props.instruction,
          operations,
          everySchemas: props.document.components.schemas,
          reviewSchemas: it.reduce(
            (acc, cur) => {
              acc[cur] = props.document.components.schemas[cur];
              return acc;
            },
            {} as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
          ),
          progress,
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
    operations: AutoBeOpenApi.IOperation[];
    everySchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    reviewSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  try {
    const pointer: IPointer<IAutoBeInterfaceSchemaContentReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceSchemaContentReview",
      controller: createController({
        model: ctx.model,
        pointer,
      }),
      histories: transformInterfaceSchemaReviewHistories({
        state: ctx.state(),
        systemPrompt: config.systemPrompt,
        instruction: props.instruction,
        operations: props.operations,
        everySchemas: props.everySchemas,
        reviewSchemas: props.reviewSchemas,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      message: "Review DTO content completeness and consistency.",
    });
    if (pointer.value === null) {
      ++props.progress.completed;
      return {};
    }

    const content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
      OpenApiV3_1Emender.convertComponents({
        schemas: pointer.value.content,
      }) as AutoBeOpenApi.IComponents
    ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

    ctx.dispatch({
      type: config.type,
      id: v7(),
      schemas: props.reviewSchemas,
      review: pointer.value.think.review,
      plan: pointer.value.think.plan,
      content,
      tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: props.progress.total,
      completed: ++props.progress.completed,
      created_at: new Date().toISOString(),
    });
    return content;
  } catch {
    ++props.progress.completed;
    return {};
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemaContentReviewApplication.IProps | null>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaContentReviewApplication.IProps> => {
    JsonSchemaFactory.fixPage("content", next);

    const result: IValidation<IAutoBeInterfaceSchemaContentReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaContentReviewApplication.IProps>(
        next,
      );
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    }

    const errors: IValidation.IError[] = [];
    JsonSchemaValidator.validateSchemas({
      errors,
      schemas: result.data.content,
      path: "$input.content",
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
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "ContentReviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
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
        review: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaContentReviewApplication,
      "claude"
    >({
      validate: {
        review: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaContentReviewApplication.IProps>;
