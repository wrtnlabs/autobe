import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceSchemaEvent,
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
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceSchemaHistory } from "./histories/transformInterfaceSchemaHistory";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchema<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    instruction: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  // fix operation type names
  JsonSchemaNamingConvention.operations(props.operations);

  // gather type names
  const typeNames: Set<string> = new Set();
  for (const op of props.operations) {
    if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
    if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
  }
  const presets: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    JsonSchemaFactory.presets(typeNames);

  // divide and conquer
  const matrix: string[][] = divideArray({
    array: Array.from(typeNames),
    capacity: AutoBeConfigConstant.INTERFACE_CAPACITY,
  });
  const progress: AutoBeProgressEventBase = {
    total: typeNames.size,
    completed: 0,
  };
  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
    ...presets,
  };
  for (const y of await executeCachedBatch(
    ctx,
    matrix.map((it) => async (promptCacheKey) => {
      const operations: AutoBeOpenApi.IOperation[] = props.operations.filter(
        (op) =>
          (op.requestBody && it.includes(op.requestBody.typeName)) ||
          (op.responseBody && it.includes(op.responseBody.typeName)),
      );
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, {
          operations,
          progress,
          promptCacheKey,
          typeNames: it,
          instruction: props.instruction,
        });
      return row;
    }),
  ))
    Object.assign(x, y);
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    typeNames: string[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const remained: Set<string> = new Set(props.typeNames);
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (let i: number = 0; i < ctx.retry; ++i) {
    if (remained.size === 0) break;
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      await process(ctx, {
        instruction: props.instruction,
        operations: props.operations,
        promptCacheKey: props.promptCacheKey,
        progress: props.progress,
        oldbie: schemas,
        remained,
      });
    for (const key of Object.keys(newbie)) {
      schemas[key] = newbie[key];
      remained.delete(key);
    }
  }
  return schemas;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    oldbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    remained: Set<string>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const already: string[] = Object.keys(props.oldbie);
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas" | "interfaceOperations"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceSchemaApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "prismaSchemas", "interfaceOperations"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    > | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        model: ctx.model,
        build: async (next) => {
          pointer.value ??= {};
          Object.assign(pointer.value, next);
        },
        pointer,
        preliminary,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaHistory({
        preliminary,
        typeNames: Array.from(
          new Set([...props.remained, ...Object.keys(props.oldbie)]),
        ),
        operations: props.operations,
        instruction: props.instruction,
        remained: props.remained,
        already,
      }),
    });
    if (pointer.value !== null) {
      const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
        OpenApiV3_1Emender.convertComponents({
          schemas: pointer.value,
        }) as AutoBeOpenApi.IComponents
      ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        schemas,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: (props.progress.completed += Object.keys(schemas).length),
        total: (props.progress.total += Object.keys(schemas).filter(
          (k) => props.remained.has(k) === false,
        ).length),
        step: ctx.state().prisma?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeInterfaceSchemaEvent);
      return out(result)(schemas);
    }
    return out(result)(null);
  });
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
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "prismaSchemas" | "interfaceOperations"
  >;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaApplication.IProps> => {
    if (
      typia.is<{
        request: {
          type: "complete";
          schemas: object;
        };
      }>(next)
    )
      JsonSchemaFactory.fixPage("schemas", next.request);

    const result: IValidation<IAutoBeInterfaceSchemaApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Check all IAuthorized types
    const errors: IValidation.IError[] = [];
    JsonSchemaValidator.validateSchemas({
      errors,
      schemas: result.data.request.schemas,
      path: "$input.request.schemas",
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
    name: SOURCE,
    application,
    execute: {
      process: async (next) => {
        if (next.request.type === "complete")
          await props.build(next.request.schemas);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemaApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemaApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceSchemaApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaApplication.IProps>;

const SOURCE = "interfaceSchema" satisfies AutoBeEventSource;
