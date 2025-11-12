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

  console.log("MISSED DTO SCHEMA TYPE NAMES", missed);

  const preliminary: AutoBePreliminaryController<
    | "analyzeFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    functions: typia.json
      .application<IAutoBeInterfaceComplementApplication>()
      .functions.map((f) => f.name),
    source: "interfaceComplement",
    kinds: [
      "analyzeFiles",
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
    | "analyzeFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  >;
  build: (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceComplementApplication.IProps> => {
    JsonSchemaFactory.fixPage("schemas", next);

    const result: IValidation<IAutoBeInterfaceComplementApplication.IProps> =
      typia.validate<IAutoBeInterfaceComplementApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    }

    const errors: IValidation.IError[] = [];
    JsonSchemaValidator.validateSchemas({
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
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ]({
    preliminary: props.preliminary,
    validate,
  }) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interfaceComplement" satisfies AutoBeEventSource,
    application,
    execute: {
      complementComponents: (next) => {
        props.build(next.schemas);
      },
      analyzeFiles: () => {},
      prismaSchemas: () => {},
      interfaceOperations: () => {},
      interfaceSchemas: () => {},
    } satisfies IAutoBeInterfaceComplementApplication,
  };
}

const collection = {
  chatgpt: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "chatgpt">({
      validate: {
        complementComponents: props.validate,
        ...props.preliminary.createValidate(),
      },
    }),
  claude: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "claude">({
      validate: {
        complementComponents: props.validate,
        ...props.preliminary.createValidate(),
      },
    }),
  gemini: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "gemini">({
      validate: {
        complementComponents: props.validate,
        ...props.preliminary.createValidate(),
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceComplementApplication.IProps>;

interface CustomValidateProps {
  validate: Validator;
  preliminary: AutoBePreliminaryController<
    | "analyzeFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
  >;
}
