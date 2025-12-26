import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceComplementHistory } from "./histories/transformInterfaceComplementHistory";
import { IAutoBeInterfaceComplementApplication } from "./structures/IAutoBeInterfaceComplementApplication";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export const orchestrateInterfaceComplement = (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> =>
  step(ctx, props, {
    wasEmpty: false,
    life: ctx.retry,
  });

async function step(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
  },
  state: {
    wasEmpty: boolean;
    life: number;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const missedTypes: string[] = missedOpenApiSchemas(props.document);
  if (missedTypes.length === 0) return props.document.components.schemas;
  else if (state.life === 0) return props.document.components.schemas;

  props.progress.total += missedTypes.length;
  const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};

  for (const missed of missedTypes) {
    try {
      const schema: AutoBeOpenApi.IJsonSchemaDescriptive = await process(ctx, {
        instruction: props.instruction,
        document: props.document,
        progress: props.progress,
        missed,
      });
      newbie[missed] = schema;
    } catch (error) {
      // Skip failed schema
      ++props.progress.completed;
    }
  }

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
    ...newbie,
    ...props.document.components.schemas,
  };
  JsonSchemaNamingConvention.schemas(props.document.operations, schemas);
  return await step(
    ctx,
    {
      instruction: props.instruction,
      document: {
        ...props.document,
        components: {
          ...props.document.components,
          schemas,
        },
      },
      progress: props.progress,
    },
    {
      wasEmpty: Object.keys(newbie).length === 0,
      life: state.life - 1,
    },
  );
}

async function process(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    missed: string;
    progress: AutoBeProgressEventBase;
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
      enforceFunctionCall: true,
      ...transformInterfaceComplementHistory({
        state: ctx.state(),
        instruction: props.instruction,
        preliminary,
        missed: props.missed,
      }),
    });
    if (pointer.value === null) throw new Error("Complement failed");

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
