import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceSchemaReviewEvent,
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
import { transformInterfaceSchemaReviewHistory } from "./histories/transformInterfaceSchemaReviewHistory";
import { IAutoBeInterfaceSchemaReviewApplication } from "./structures/IAutoBeInterfaceSchemaReviewApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

interface IConfig {
  kind: AutoBeInterfaceSchemaReviewEvent["kind"];
  systemPrompt: string;
}

export async function orchestrateInterfaceSchemaReview(
  ctx: AutoBeContext,
  config: IConfig,
  props: {
    document: AutoBeOpenApi.IDocument;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    instruction: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const typeNames: string[] = Object.keys(props.schemas).filter(
    (k) => JsonSchemaValidator.isPreset(k) === false,
  );
  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  await executeCachedBatch(
    ctx,
    typeNames.map((it) => async (promptCacheKey) => {
      const predicate = (key: string) =>
        key === it ||
        (JsonSchemaValidator.isPage(key) &&
          JsonSchemaFactory.getPageName(key) === it);
      const reviewOperations: AutoBeOpenApi.IOperation[] =
        props.document.operations.filter(
          (op) =>
            (op.requestBody && predicate(op.requestBody.typeName)) ||
            (op.responseBody && predicate(op.responseBody.typeName)),
        );
      try {
        const reviewed: AutoBeOpenApi.IJsonSchemaDescriptive = await process(
          ctx,
          config,
          {
            instruction: props.instruction,
            document: props.document,
            typeName: it,
            reviewOperations,
            reviewSchema: props.schemas[it],
            progress: props.progress,
            promptCacheKey,
          },
        );
        x[it] = reviewed;
      } catch {
        ++props.progress.completed;
      }
    }),
  );
  JsonSchemaNamingConvention.schemas(props.document.operations, x);
  return x;
}

async function process(
  ctx: AutoBeContext,
  config: IConfig,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    typeName: string;
    reviewOperations: AutoBeOpenApi.IOperation[];
    reviewSchema: AutoBeOpenApi.IJsonSchemaDescriptive;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeOpenApi.IJsonSchemaDescriptive> {
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaReviewApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "previousAnalysisFiles",
      "databaseSchemas",
      "previousDatabaseSchemas",
      "interfaceOperations",
      "previousInterfaceOperations",
      "interfaceSchemas",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      interfaceOperations: props.reviewOperations,
      interfaceSchemas: { [props.typeName]: props.reviewSchema },
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceSchemaReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.typeName,
        operations: props.document.operations,
        preliminary,
        pointer,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaReviewHistory({
        state: ctx.state(),
        systemPrompt: config.systemPrompt,
        instruction: props.instruction,
        typeName: props.typeName,
        reviewOperations: props.reviewOperations,
        reviewSchema: props.reviewSchema,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const content: AutoBeOpenApi.IJsonSchemaDescriptive =
      pointer.value.content === null
        ? props.reviewSchema
        : (
            ((
              OpenApiV3_1Emender.convertComponents({
                schemas: {
                  [props.typeName]: pointer.value.content,
                },
              }) as AutoBeOpenApi.IComponents
            ).schemas ?? {}) as Record<
              string,
              AutoBeOpenApi.IJsonSchemaDescriptive
            >
          )[props.typeName];
    ctx.dispatch({
      type: SOURCE,
      kind: config.kind,
      id: v7(),
      typeName: props.typeName,
      schema: props.reviewSchema,
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
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    operations: AutoBeOpenApi.IOperation[];
    pointer: IPointer<
      IAutoBeInterfaceSchemaReviewApplication.IComplete | null | false
    >;
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
      | "previousInterfaceSchemas"
    >;
  },
): IAgenticaController.IClass {
  const validate: Validator = (next) => {
    const result: IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceSchemaReviewApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    } else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Only validate schema if content is not null (has corrections)
    // If content is null, schema is perfect and doesn't need validation
    if (result.data.request.content !== null) {
      const errors: IValidation.IError[] = [];
      JsonSchemaValidator.validateSchema({
        errors,
        databaseSchemas: new Set(
          ctx
            .state()
            .database!.result.data.files.map((f) => f.models.map((m) => m.name))
            .flat(),
        ),
        operations: props.preliminary.getAll().interfaceOperations,
        typeName: props.typeName,
        schema: result.data.request.content,
        path: "$input.request.content",
      });
      if (errors.length !== 0)
        return {
          success: false,
          errors,
          data: next,
        };
    }
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceSchemaReviewApplication>({
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
          "IAutoBeInterfaceSchemaReviewApplication.IComplete"
        ] as ILlmSchema.IObject
      ).properties.content as ILlmSchema.IReference
    ).$ref = "AutoBeOpenApi.IJsonSchemaDescriptive.IObject";

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceSchemaReviewApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaReviewApplication.IProps>;

const SOURCE = "interfaceSchemaReview" satisfies AutoBeEventSource;
