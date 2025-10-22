import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemaSecurityReviewEvent,
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
import { transformInterfaceSchemaReviewHistories } from "./histories/transformInterfaceSchemaReviewHistories";
import { IAutoBeInterfaceSchemaSecurityReviewApplication } from "./structures/IAutoBeInterfaceSchemaSecurityReviewApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchemaSecurityReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  capacity: number = AutoBeConfigConstant.INTERFACE_CAPACITY,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const schemas = document.components.schemas as Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  >;
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
        await divideAndConquer(ctx, document, it, progress, promptCacheKey);
      return row;
    }),
  )) {
    JsonSchemaNamingConvention.schemas(document.operations, x, y);
    Object.assign(x, y);
  }
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>[],
  progress: AutoBeProgressEventBase,
  promptCacheKey: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const schema = schemas.reduce((acc, cur) => Object.assign(acc, cur), {});
  return step(ctx, document, schema, progress, promptCacheKey);
}

export async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  progress: AutoBeProgressEventBase,
  promptCacheKey: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  try {
    const pointer: IPointer<IAutoBeInterfaceSchemaSecurityReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceSchemaSecurityReview",
      controller: createController({
        model: ctx.model,
        pointer,
        operations: document.operations,
        schemas,
      }),
      histories: transformInterfaceSchemaReviewHistories(
        ctx.state(),
        document,
        schemas,
      ),
      enforceFunctionCall: true,
      promptCacheKey,
      message: "Review schemas for security compliance.",
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
      type: "interfaceSchemaSecurityReview",
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
    } satisfies AutoBeInterfaceSchemaSecurityReviewEvent);
    return content;
  } catch {
    ++progress.completed;
    return {};
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemaSecurityReviewApplication.IProps | null>;
  operations: AutoBeOpenApi.IOperation[];
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaSecurityReviewApplication.IProps> => {
    JsonSchemaFactory.fixPage("content", next);

    const result: IValidation<IAutoBeInterfaceSchemaSecurityReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaSecurityReviewApplication.IProps>(
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
    name: "SecurityReviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeInterfaceSchemaSecurityReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaSecurityReviewApplication,
      "chatgpt"
    >({
      validate: {
        review: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeInterfaceSchemaSecurityReviewApplication,
      "claude"
    >({
      validate: {
        review: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaSecurityReviewApplication.IProps>;

export interface IProgress {
  total: number;
  completed: number;
}
