import { IAgenticaController } from "@agentica/core";
import { AutoBeEventSource, AutoBeOpenApi } from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceComplementHistory } from "./histories/transformInterfaceComplementHistory";
import { IAutoBeInterfaceComplementApplication } from "./structures/IAutoBeInterfaceComplementApplication";
import { JsonSchemaFactory } from "./utils/JsonSchemaFactory";
import { JsonSchemaNamingConvention } from "./utils/JsonSchemaNamingConvention";
import { JsonSchemaValidator } from "./utils/JsonSchemaValidator";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

export function orchestrateInterfaceComplement<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  return step(ctx, props, {
    wasEmpty: false,
    life: 10,
  });
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
  },
  progress: {
    wasEmpty: boolean;
    life: number;
  },
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const missed: string[] = missedOpenApiSchemas(props.document);
  if (missed.length === 0) return props.document.components.schemas;
  else if (progress.life === 0) return props.document.components.schemas;

  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceComplementApplication>(),
    source: "interfaceComplement",
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "interfaceOperations",
      "interfaceSchemas",
    ],
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
      source: "interfaceComplement",
      controller: createController({
        model: ctx.model,
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
        missed,
      }),
    });
    if (pointer.value !== null) {
      ctx.dispatch({
        type: "interfaceComplement",
        id: v7(),
        missed,
        schemas: pointer.value,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      });
      const empty: boolean = Object.keys(pointer.value).length === 0;
      if (empty === true && progress.wasEmpty === true)
        return out(result)(props.document.components.schemas);

      const newSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
        ...pointer.value,
        ...props.document.components.schemas,
      };
      JsonSchemaNamingConvention.schemas(props.document.operations, newSchemas);
      return out(result)(
        await step(
          ctx,
          {
            instruction: props.instruction,
            document: {
              ...props.document,
              components: {
                ...props.document.components,
                schemas: newSchemas,
              },
            },
          },
          {
            wasEmpty: empty,
            life: progress.life - 1,
          },
        ),
      );
    }
    return out(result)(null);
  });
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  >;
  build: (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ) => void;
}): IAgenticaController.IClass<Model> {
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
        request: result.data.request,
      }) as any;

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
    name: "interfaceComplement" satisfies AutoBeEventSource,
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
