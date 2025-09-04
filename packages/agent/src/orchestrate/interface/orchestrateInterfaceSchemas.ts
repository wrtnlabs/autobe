import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemasEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceSchemaHistories } from "./histories/transformInterfaceSchemaHistories";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";
import { fixPageSchemas } from "./utils/fixPageSchemas";
import { validateAuthorizationSchema } from "./utils/validateAuthorizationSchema";

export async function orchestrateInterfaceSchemas<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  capacity: number = 5,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const typeNames: Set<string> = new Set();
  for (const op of operations) {
    if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
    if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
  }
  const matrix: string[][] = divideArray({
    array: Array.from(typeNames),
    capacity,
  });
  const progress: AutoBeProgressEventBase = {
    total: typeNames.size,
    completed: 0,
  };

  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const y of await executeCachedBatch(
    matrix.map((it) => async (promptCacheKey) => {
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, operations, it, progress, promptCacheKey);
      return row;
    }),
  ))
    Object.assign(x, y);
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  typeNames: string[],
  progress: AutoBeProgressEventBase,
  promptCacheKey: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const remained: Set<string> = new Set(typeNames);
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (let i: number = 0; i < ctx.retry; ++i) {
    if (remained.size === 0) break;
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      await process(
        ctx,
        operations,
        schemas,
        remained,
        progress,
        promptCacheKey,
      );
    for (const key of Object.keys(newbie)) {
      schemas[key] = newbie[key];
      remained.delete(key);
    }
  }
  return schemas;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  oldbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  remained: Set<string>,
  progress: AutoBeProgressEventBase,
  promptCacheKey: string,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const already: string[] = Object.keys(oldbie);
  const pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceSchemas",
    histories: transformInterfaceSchemaHistories(ctx.state(), operations),
    controller: createController({
      model: ctx.model,
      build: async (next) => {
        pointer.value ??= {};
        Object.assign(pointer.value, next);
      },
      pointer,
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    message: StringUtil.trim`
      Make type components please.

      Here is the list of request/response bodies' type names from
      OpenAPI operations. Make type components of them. If more object
      types are required during making the components, please make them
      too.

      ${Array.from(remained)
        .map((k) => `      - \`${k}\``)
        .join("\n")}${
        already.length !== 0
          ? StringUtil.trim`

            > By the way, here is the list of components schemas what you've
            > already made. So, you don't need to make them again.
            >
            ${already.map((k) => `> - \`${k}\``).join("\n")}
          `
          : ""
      }
    `,
  });
  if (pointer.value === null) throw new Error("Failed to create components.");

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
    OpenApiV3_1Emender.convertComponents({
      schemas: pointer.value,
    }) as AutoBeOpenApi.IComponents
  ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  ctx.dispatch({
    type: "interfaceSchemas",
    id: v7(),
    schemas,
    tokenUsage,
    completed: (progress.completed += Object.keys(schemas).length),
    total: (progress.total += Object.keys(schemas).filter(
      (k) => remained.has(k) === false,
    ).length),
    step: ctx.state().prisma?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceSchemasEvent);
  return schemas;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (
    next: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ) => Promise<void>;
  pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaApplication.IProps> => {
    fixPageSchemas(next, "schemas");

    const result: IValidation<IAutoBeInterfaceSchemaApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaApplication.IProps>(next);
    if (result.success === false) return result;

    // Check all IAuthorized types
    const errors: IValidation.IError[] = [];
    validateAuthorizationSchema({
      errors,
      schemas: result.data.schemas,
      path: "$input.schemas",
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
    name: "interface",
    application,
    execute: {
      makeComponents: async (next) => {
        await props.build(next.schemas);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemaApplication, "chatgpt">({
      validate: {
        makeComponents: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemaApplication, "claude">({
      validate: {
        makeComponents: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaApplication.IProps>;
