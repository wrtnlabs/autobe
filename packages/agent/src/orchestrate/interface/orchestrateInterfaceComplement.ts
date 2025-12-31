import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, missedOpenApiSchemas } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceComplementHistory } from "./histories/transformInterfaceComplementHistory";
import { IAutoBeInterfaceComplementApplication } from "./structures/IAutoBeInterfaceComplementApplication";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export const orchestrateInterfaceComplement = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> => {
  const typeNames: string[] = missedOpenApiSchemas(props.document).filter(
    (k) => JsonSchemaValidator.isPreset(k) === false,
  );
  if (typeNames.length === 0) return {};
  props.progress.total += typeNames.length;

  const result: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      result[it] = await process(ctx, {
        instruction: props.instruction,
        document: props.document,
        missed: it,
        progress: props.progress,
        promptCacheKey,
      });
    }),
  );
  return result;
};

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    missed: string;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceComplementApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "interfaceOperations",
      "interfaceSchemas",
      "previousAnalysisFiles",
      "previousPrismaSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      interfaceOperations: props.document.operations.filter(
        (o) =>
          o.requestBody?.typeName === props.missed ||
          o.responseBody?.typeName === props.missed,
      ),
      interfaceSchemas: Object.fromEntries(
        Object.entries(props.document.components.schemas).filter(([_k, v]) => {
          let found: boolean = false;
          AutoBeOpenApiTypeChecker.visit({
            components: {
              schemas: {},
              authorizations: [],
            },
            schema: v,
            closure: (next) => {
              if (
                AutoBeOpenApiTypeChecker.isReference(next) &&
                next.$ref.split("/").pop() === props.missed
              )
                found = true;
            },
          });
          return found;
        }),
      ),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeOpenApi.IJsonSchemaDescriptive | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.missed,
        operations: props.document.operations,
        build: (next) => {
          const container: Record<
            string,
            AutoBeOpenApi.IJsonSchemaDescriptive
          > = (OpenApiV3_1Emender.convertComponents({
            schemas: {
              [props.missed]: next,
            },
          }).schemas ?? {}) as Record<
            string,
            AutoBeOpenApi.IJsonSchemaDescriptive
          >;
          pointer.value = container[props.missed];
        },
        preliminary,
      }),
      promptCacheKey: props.promptCacheKey,
      enforceFunctionCall: true,
      ...transformInterfaceComplementHistory({
        state: ctx.state(),
        instruction: props.instruction,
        preliminary,
        missed: props.missed,
      }),
    });
    if (pointer.value === null) throw new Error("Complementation failed");

    ++props.progress.completed;
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      missed: props.missed,
      typeName: props.missed,
      schema: pointer.value,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
      completed: props.progress.completed,
      total: props.progress.total,
      created_at: new Date().toISOString(),
    });
    return out(result)(pointer.value);
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    operations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "prismaSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisFiles"
      | "previousPrismaSchemas"
      | "previousInterfaceSchemas"
      | "previousInterfaceOperations"
    >;
    build: (schema: AutoBeOpenApi.IJsonSchemaDescriptive) => void;
  },
): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceComplementApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceComplementApplication.IProps> =
      typia.validate<IAutoBeInterfaceComplementApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

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
    typia.llm.application<IAutoBeInterfaceComplementApplication>({
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
          "IAutoBeInterfaceComplementApplication.IComplete"
        ] as ILlmSchema.IObject
      ).properties.schema as ILlmSchema.IReference
    ).$ref = "AutoBeOpenApi.IJsonSchemaDescriptive.IObject";

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request.schema);
      },
    } satisfies IAutoBeInterfaceComplementApplication,
  };
}

const SOURCE = "interfaceComplement" satisfies AutoBeEventSource;
