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

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceSchemaHistory } from "./histories/transformInterfaceSchemaHistory";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchema(
  ctx: AutoBeContext,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    instruction: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  // fix operation type names
  JsonSchemaNamingConvention.operations(props.operations);

  // gather type names
  const gathered: Set<string> = new Set();
  for (const op of props.operations) {
    if (op.requestBody !== null) gathered.add(op.requestBody.typeName);
    if (op.responseBody !== null) gathered.add(op.responseBody.typeName);
  }
  const presets: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    JsonSchemaFactory.presets(gathered);

  // divide and conquer
  const typeNames: string[] = Array.from(gathered).filter(
    (k) => JsonSchemaValidator.isPreset(k) === false,
  );
  const progress: AutoBeProgressEventBase = {
    total: typeNames.length,
    completed: 0,
  };
  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
    ...presets,
  };
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const operations: AutoBeOpenApi.IOperation[] = props.operations.filter(
        (op) =>
          (op.requestBody && op.requestBody.typeName === it) ||
          (op.responseBody && op.responseBody.typeName === it),
      );
      const row: AutoBeOpenApi.IJsonSchemaDescriptive = await process(ctx, {
        operations,
        progress,
        promptCacheKey,
        typeName: it,
        instruction: props.instruction,
      });
      x[it] = row;
    }),
  );
  return x;
}

async function process(
  ctx: AutoBeContext,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    typeName: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceSchemaApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "interfaceOperations",
      "previousAnalysisFiles",
      "previousPrismaSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeOpenApi.IJsonSchemaDescriptive | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        build: async (next) => {
          pointer.value = next;
        },
        preliminary,
        typeName: props.typeName,
        operations: props.operations,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaHistory({
        preliminary,
        typeName: props.typeName,
        operations: props.operations,
        instruction: props.instruction,
      }),
    });
    if (pointer.value !== null) {
      const container: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = ((
        OpenApiV3_1Emender.convertComponents({
          schemas: {
            [props.typeName]: pointer.value,
          },
        }) as AutoBeOpenApi.IComponents
      ).schemas ?? {}) as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      const schema: AutoBeOpenApi.IJsonSchemaDescriptive =
        container[props.typeName];

      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        typeName: props.typeName,
        schema,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().prisma?.step ?? 0,
        created_at: new Date().toISOString(),
      } satisfies AutoBeInterfaceSchemaEvent);
      return out(result)(schema);
    }
    return out(result)(null);
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    build: (next: AutoBeOpenApi.IJsonSchemaDescriptive) => Promise<void>;
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "prismaSchemas"
      | "interfaceOperations"
      | "previousAnalysisFiles"
      | "previousPrismaSchemas"
      | "previousInterfaceOperations"
      | "previousInterfaceSchemas"
    >;
    operations: AutoBeOpenApi.IOperation[];
    typeName: string;
  },
): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceSchemaApplication.IProps> => {
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
    JsonSchemaValidator.validateSchema({
      errors,
      prismaSchemas: new Set(
        ctx
          .state()
          .prisma!.result.data.files.map((f) => f.models.map((m) => m.name))
          .flat(),
      ),
      operations: props.operations,
      typeName: props.typeName,
      schema: result.data.request.schema,
      path: "$input.request.schema",
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  if (
    JsonSchemaValidator.isObjectType({
      operations: props.operations,
      typeName: props.typeName,
    }) === true
  )
    (
      (
        application.functions[0].parameters.$defs[
          "IAutoBeInterfaceSchemaApplication.IComplete"
        ] as ILlmSchema.IObject
      ).properties.schema as ILlmSchema.IReference
    ).$ref = "AutoBeOpenApi.IJsonSchemaDescriptive.IObject";

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: async (next) => {
        if (next.request.type === "complete")
          await props.build(next.request.schema);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const SOURCE = "interfaceSchema" satisfies AutoBeEventSource;
