import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceComplementHistory } from "./histories/transformInterfaceComplementHistory";
import { IAutoBeInterfaceComplementApplication } from "./structures/IAutoBeInterfaceComplementApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export const orchestrateInterfaceComplement = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> =>
  step(ctx, props, {
    wasEmpty: false,
    life: 10,
  });

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
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
  const missed: string[] = missedOpenApiSchemas(props.document);
  if (missed.length === 0) return props.document.components.schemas;
  else if (state.life === 0) return props.document.components.schemas;

  props.progress.total += missed.length;
  const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await divideAndConquer(ctx, {
      instruction: props.instruction,
      document: props.document,
      progress: props.progress,
      missed,
    });
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

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    missed: string[];
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const matrix: string[][] = divideArray({
    array: props.missed,
    capacity: AutoBeConfigConstant.INTERFACE_CAPACITY,
  });
  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const missed of matrix) {
    const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      await process(ctx, {
        instruction: props.instruction,
        document: props.document,
        progress: props.progress,
        missed,
      });
    Object.assign(x, row);
  }
  return x;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    missed: string[];
    progress: AutoBeProgressEventBase;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
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
    const pointer: IPointer<Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    > | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController(ctx, {
        model: ctx.model,
        operations: props.document.operations,
        build: (next) => {
          pointer.value ??= {};
          Object.assign(
            pointer.value,
            (OpenApiV3_1Emender.convertComponents({
              schemas: next,
            }).schemas ?? {}) as Record<
              string,
              AutoBeOpenApi.IJsonSchemaDescriptive
            >,
          );
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
    if (pointer.value === null) return out(result)(null);

    props.progress.completed += Object.keys(pointer.value).length;
    props.progress.total +=
      Object.keys(pointer.value).length - props.missed.length;
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      missed: props.missed,
      schemas: pointer.value,
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

function createController<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    model: Model;
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
    build: (
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
    ) => void;
  },
): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceComplementApplication.IProps> => {
    if (
      typia.is<{
        request: {
          type: "complete";
          schemas: object;
        };
      }>(next)
    )
      JsonSchemaFactory.fixPage("schemas", next.request);

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
    JsonSchemaValidator.validateSchemas({
      errors,
      prismaSchemas: new Set(
        ctx
          .state()
          .prisma!.result.data.files.map((f) => f.models.map((m) => m.name))
          .flat(),
      ),
      operations: props.operations,
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

  const application: ILlmApplication<Model> = props.preliminary.fixApplication(
    collection[
      props.model === "chatgpt"
        ? "chatgpt"
        : props.model === "gemini"
          ? "gemini"
          : "claude"
    ](
      validate,
    ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>,
  );
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request.schemas);
      },
    } satisfies IAutoBeInterfaceComplementApplication,
  };
}

const collection = {
  chatgpt: (validator: Validator) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "chatgpt">({
      validate: {
        process: validator,
      },
    }),
  claude: (validator: Validator) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "claude">({
      validate: {
        process: validator,
      },
    }),
  gemini: (validator: Validator) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "gemini">({
      validate: {
        process: validator,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceComplementApplication.IProps>;

const SOURCE = "interfaceComplement" satisfies AutoBeEventSource;
