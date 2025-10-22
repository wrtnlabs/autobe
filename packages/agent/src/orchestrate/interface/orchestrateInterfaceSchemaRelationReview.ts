import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemaRelationReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
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
import { transformInterfaceSchemaRelationReviewHistories } from "./histories/transformInterfaceSchemaRelationReviewHistories";
import { IAutoBeInterfaceSchemaRelationReviewApplication } from "./structures/IAutoBeInterfaceSchemaRelationReviewApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchemaRelationReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  capacity: number = AutoBeConfigConstant.INTERFACE_CAPACITY,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const a = Object.entries(schemas).map(([key, schema]) => {
    return { [key]: schema };
  });

  const matrix: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>[][] =
    divideArray({
      array: a,
      capacity,
    });
  const progress: IProgress = {
    total: matrix.length,
    completed: 0,
  };

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const y of await executeCachedBatch(
    matrix.map((it) => async (promptCacheKey) => {
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, operations, it, progress, promptCacheKey);
      return row;
    }),
  )) {
    JsonSchemaNamingConvention.schemas(operations, x, y);
    Object.assign(x, y);
  }
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>[],
  progress: AutoBeProgressEventBase,
  promptCacheKey: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const schema = schemas.reduce((acc, cur) => Object.assign(acc, cur), {});
  return step(ctx, operations, schema, progress, promptCacheKey);
}

export async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  progress: AutoBeProgressEventBase,
  promptCacheKey: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  try {
    const pointer: IPointer<IAutoBeInterfaceSchemaRelationReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceSchemaRelationReview",
      controller: createController({
        model: ctx.model,
        pointer,
        operations,
        schemas,
      }),
      histories: transformInterfaceSchemaRelationReviewHistories(
        ctx.state(),
        operations,
        schemas,
      ),
      enforceFunctionCall: true,
      promptCacheKey,
      message: "Review DTO relationships and structure.",
    });
    if (pointer.value === null) {
      ++progress.completed;
      return {};
    }

    const content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
      OpenApiV3_1Emender.convertComponents({
        schemas: pointer.value.content,
      }) as AutoBeOpenApi.IComponents
    ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

    ctx.dispatch({
      type: "interfaceSchemaRelationReview",
      id: v7(),
      schemas: schemas,
      review: pointer.value.think.review,
      plan: pointer.value.think.plan,
      content,
      tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: progress.total,
      completed: ++progress.completed,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaRelationReviewEvent);
    return content;
  } catch {
    ++progress.completed;
    return {};
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemaRelationReviewApplication.IProps | null>;
  operations: AutoBeOpenApi.IOperation[];
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaRelationReviewApplication.IProps> => {
    JsonSchemaFactory.fixPage("content", next);

    const result: IValidation<IAutoBeInterfaceSchemaRelationReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaRelationReviewApplication.IProps>(
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
    name: "RelationshipReviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeInterfaceSchemaRelationReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaRelationReviewApplication,
      "chatgpt"
    >({
      validate: {
        review: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaRelationReviewApplication,
      "claude"
    >({
      validate: {
        review: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaRelationReviewApplication.IProps>;

export interface IProgress {
  total: number;
  completed: number;
}
