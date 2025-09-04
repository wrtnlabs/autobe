import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemasReviewEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceSchemasReviewHistories } from "./histories/transformInterfaceSchemasReviewHistories";
import { IAutoBeInterfaceSchemasReviewApplication } from "./structures/IAutobeInterfaceSchemasReviewApplication";
import { authTokenSchema } from "./structures/authTokenSchema";
import { eraseVulnerableSchemas } from "./utils/eraseVulnerableSchemas";
import { validateAuthorizationSchema } from "./utils/validateAuthorizationSchema";
import { validateOpenApiPageSchema } from "./utils/validateOpenApiPageSchema";

export async function orchestrateInterfaceSchemasReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const a = Object.entries(schemas).map(([key, schema]) => {
    return { [key]: schema };
  });

  const matrix: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>[][] =
    divideArray({
      array: a,
      capacity: 8,
    });

  const roles: string[] =
    ctx.state().analyze?.roles.map((role) => role.name) ?? [];

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    roles.length > 0
      ? {
          IAuthorization: authTokenSchema,
        }
      : {};

  const progress: IProgress = {
    total: matrix.length,
    completed: 0,
  };
  for (const y of await executeCachedBatch(
    matrix.map((it) => async (promptCacheKey) => {
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, operations, it, progress, promptCacheKey);
      return row;
    }),
  )) {
    Object.assign(x, y);
  }

  if (x.IAuthorizationToken) x.IAuthorizationToken = authTokenSchema;
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
    const pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceSchemasReview",
      controller: createController({
        model: ctx.model,
        pointer,
        operations,
        schemas,
      }),
      histories: transformInterfaceSchemasReviewHistories(
        ctx.state(),
        operations,
        schemas,
      ),
      enforceFunctionCall: true,
      promptCacheKey,
      message: "Review type schemas.",
    });
    if (pointer.value === null) {
      console.error("Failed to extract review information.");
      ++progress.completed;
      return {};
    }

    const content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
      OpenApiV3_1Emender.convertComponents({
        schemas: pointer.value.content,
      }) as AutoBeOpenApi.IComponents
    ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

    ctx.dispatch({
      type: "interfaceSchemasReview",
      id: v7(),
      schemas: schemas,
      review: pointer.value.review,
      plan: pointer.value.plan,
      content,
      tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      total: progress.total,
      completed: ++progress.completed,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemasReviewEvent);
    return content;
  } catch (error) {
    console.error("Error occurred during interface schemas review:", error);
    ++progress.completed;
    return {};
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  pointer: IPointer<IAutoBeInterfaceSchemasReviewApplication.IProps | null>;
  operations: AutoBeOpenApi.IOperation[];
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps> => {
    eraseVulnerableSchemas(next, "content");

    const result: IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemasReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    validateAuthorizationSchema({
      errors,
      schemas: result.data.content,
      path: "$input.content",
    });

    Object.entries(result.data.content).forEach(([key, schema]) => {
      validateOpenApiPageSchema({
        path: "$input.content",
        errors,
        key,
        schema,
      });
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
    name: "Reviewer",
    application,
    execute: {
      review: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeInterfaceSchemasReviewApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemasReviewApplication, "chatgpt">({
      validate: {
        review: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemasReviewApplication, "claude">({
      validate: {
        review: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemasReviewApplication.IProps>;

export interface IProgress {
  total: number;
  completed: number;
}
