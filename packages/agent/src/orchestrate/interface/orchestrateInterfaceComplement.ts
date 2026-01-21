import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceComplementEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, missedOpenApiSchemas } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceComplementHistory } from "./histories/transformInterfaceComplementHistory";
import { IAutoBeInterfaceComplementApplication } from "./structures/IAutoBeInterfaceComplementApplication";
import { AutoBeJsonSchemaFactory } from "./utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "./utils/AutoBeJsonSchemaValidator";
import { AutoBeLlmSchemaFactory } from "./utils/AutoBeLlmSchemaFactory";
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
    (k) => AutoBeJsonSchemaValidator.isPreset(k) === false,
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
        typeName: it,
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
    typeName: string;
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
    | "previousInterfaceSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceComplementApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "interfaceOperations",
      "interfaceSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
      interfaceSchemas: props.document.components.schemas,
    },
    local: {
      interfaceOperations: props.document.operations.filter((o) => {
        const predicate = (key: string | undefined): boolean => {
          if (key === undefined) return false;
          const schema: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
            props.document.components.schemas[key];
          return schema !== undefined && isReferenced(schema, props.typeName);
        };
        return (
          predicate(o.requestBody?.typeName) ||
          predicate(o.responseBody?.typeName)
        );
      }),
      interfaceSchemas: Object.fromEntries(
        Object.entries(props.document.components.schemas).filter(
          ([_k, v]) => v !== undefined && isReferenced(v, props.typeName),
        ),
      ),
    },
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceComplementApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        typeName: props.typeName,
        operations: props.document.operations,
        build: (next) => {
          pointer.value = next;
        },
        preliminary,
      }),
      promptCacheKey: props.promptCacheKey,
      enforceFunctionCall: true,
      ...transformInterfaceComplementHistory({
        document: props.document,
        instruction: props.instruction,
        preliminary,
        typeName: props.typeName,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    ++props.progress.completed;

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
      step: ctx.state().analyze?.step ?? 0,
      completed: props.progress.completed,
      total: props.progress.total,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceComplementEvent);
    return out(result)(schema);
  });
}

function createController(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    operations: AutoBeOpenApi.IOperation[];
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceSchemas"
      | "previousInterfaceOperations"
    >;
    build: (schema: IAutoBeInterfaceComplementApplication.IComplete) => void;
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
    AutoBeJsonSchemaValidator.validateSchema({
      errors,
      models: ctx.state().database!.result.data.files.flatMap((f) => f.models),
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
    AutoBeJsonSchemaValidator.isObjectType({
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
    ).$ref = "#/$defs/AutoBeOpenApi.IJsonSchemaDescriptive.IObject";
  AutoBeLlmSchemaFactory.fixDatabasePlugin(
    ctx.state(),
    application.functions[0].parameters.$defs,
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeInterfaceComplementApplication,
  };
}

const SOURCE = "interfaceComplement" satisfies AutoBeEventSource;

const isReferenced = (
  schema: AutoBeOpenApi.IJsonSchemaDescriptive,
  typeName: string,
): boolean => {
  let found: boolean = false;
  AutoBeOpenApiTypeChecker.visit({
    components: {
      authorizations: [],
      schemas: {},
    },
    schema,
    closure: (next) => {
      if (
        AutoBeOpenApiTypeChecker.isReference(next) &&
        next.$ref.split("/").pop() === typeName
      )
        found = true;
    },
  });
  return found;
};
