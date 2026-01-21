import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceSchemaEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceSchemaHistory } from "./histories/transformInterfaceSchemaHistory";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { AutoBeLlmSchemaFactory } from "./utils/AutoBeLlmSchemaFactory";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export async function orchestrateInterfaceSchema(
  ctx: AutoBeContext,
  props: {
    operations: AutoBeOpenApi.IOperation[];
    instruction: string;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  // gather type names
  const collection: Set<string> = new Set();
  const gather = (key: string): void => {
    if (AutoBeJsonSchemaValidator.isPage(key))
      collection.add(AutoBeJsonSchemaFactory.getPageName(key));
    collection.add(key);
  };
  for (const op of props.operations) {
    if (op.requestBody !== null) gather(op.requestBody.typeName);
    if (op.responseBody !== null) gather(op.responseBody.typeName);
  }
  const presets: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    AutoBeJsonSchemaFactory.presets(collection);

  // divide and conquer
  const typeNames: string[] = Array.from(collection).filter(
    (k) => AutoBeJsonSchemaValidator.isPreset(k) === false,
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
      const predicate = (key: string) =>
        key === it ||
        (AutoBeJsonSchemaValidator.isPage(key) &&
          AutoBeJsonSchemaFactory.getPageName(key) === it);
      const operations: AutoBeOpenApi.IOperation[] = props.operations.filter(
        (op) =>
          (op.requestBody && predicate(op.requestBody.typeName)) ||
          (op.responseBody && predicate(op.responseBody.typeName)),
      );
      const row: AutoBeOpenApi.IJsonSchemaDescriptive = await process(ctx, {
        operations,
        progress,
        otherTypeNames: typeNames.filter((k) => k !== it),
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
    otherTypeNames: string[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceSchemaApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "interfaceOperations",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.operations,
    },
    local: {
      interfaceOperations: props.operations.filter((o) => {
        const predicate = (key: string) =>
          key === props.typeName ||
          (AutoBeJsonSchemaValidator.isPage(key) &&
            AutoBeJsonSchemaFactory.getPageName(key) === props.typeName);
        return (
          (o.requestBody && predicate(o.requestBody.typeName)) ||
          (o.responseBody && predicate(o.responseBody.typeName))
        );
      }),
      databaseSchemas: AutoBeJsonSchemaFactory.getNeighborDatabaseSchemas({
        typeName: props.typeName,
        application: ctx.state().database!.result.data,
      }),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceSchemaApplication.IComplete | null> =
      {
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
        operations: props.operations,
        instruction: props.instruction,
        typeName: props.typeName,
        otherTypeNames: props.otherTypeNames,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const schema: AutoBeOpenApi.IJsonSchemaDescriptive =
      AutoBeJsonSchemaFactory.fixSchema(pointer.value.schema);

    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      typeName: props.typeName,
      analysis: pointer.value.analysis,
      rationale: pointer.value.rationale,
      schema,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().database?.step ?? 0,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaEvent);
    return out(result)(schema);
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    build: (next: IAutoBeInterfaceSchemaApplication.IComplete) => Promise<void>;
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "interfaceOperations"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
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
    AutoBeJsonSchemaValidator.validateSchema({
      errors,
      databaseSchemas: new Set(
        ctx
          .state()
          .database!.result.data.files.map((f) => f.models.map((m) => m.name))
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
    AutoBeJsonSchemaValidator.isObjectType({
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
  AutoBeLlmSchemaFactory.fixDatabasePlugin(
    ctx.state(),
    application.functions[0].parameters.$defs,
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: async (next) => {
        if (next.request.type === "complete") await props.build(next.request);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const SOURCE = "interfaceSchema" satisfies AutoBeEventSource;
