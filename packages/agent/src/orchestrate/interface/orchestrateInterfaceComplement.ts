import { IAgenticaController } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceComplementHistories } from "./histories/transformInterfaceComplementHistories";
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
  return step(ctx, props, false);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
  },
  wasEmpty: boolean,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const missed: string[] = missedOpenApiSchemas(props.document);
  if (missed.length === 0) return props.document.components.schemas;

  const pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceComplement",
    histories: transformInterfaceComplementHistories({
      state: ctx.state(),
      instruction: props.instruction,
      document: props.document,
      missed,
    }),
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
    }),
    enforceFunctionCall: true,
    message: "Fill missing schema types please",
  });
  if (pointer.value === null)
    // unreachable
    throw new Error(
      "Failed to fill missing schema types. No response from agentica.",
    );
  ctx.dispatch({
    type: "interfaceComplement",
    id: v7(),
    missed,
    schemas: pointer.value,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  });

  const empty: boolean = Object.keys(pointer.value).length === 0;
  if (empty === true && wasEmpty === true)
    return props.document.components.schemas;

  const newSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
    ...pointer.value,
    ...props.document.components.schemas,
  };
  JsonSchemaNamingConvention.schemas(props.document.operations, newSchemas);
  return step(
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
    empty,
  );
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
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
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      complementComponents: (next) => {
        props.build(next.schemas);
      },
    } satisfies IAutoBeInterfaceComplementApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "chatgpt">({
      validate: {
        complementComponents: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceComplementApplication, "claude">({
      validate: {
        complementComponents: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceComplementApplication.IProps>;
