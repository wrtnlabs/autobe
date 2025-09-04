import { IAgenticaController } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import {
  ILlmApplication,
  ILlmSchema,
  IValidation,
  OpenApiTypeChecker,
} from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceComplementHistories } from "./histories/transformInterfaceComplementHistories";
import { IAutoBeInterfaceComplementApplication } from "./structures/IAutoBeInterfaceComplementApplication";
import { fixPageSchemas } from "./utils/fixPageSchemas";
import { validateAuthorizationSchema } from "./utils/validateAuthorizationSchema";

export function orchestrateInterfaceComplement<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  return step(ctx, document, 8);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  life: number,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const missed: string[] = getMissed(document);
  if (missed.length === 0 || life <= 0) {
    return document.components.schemas;
  }

  const pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceComplement",
    histories: transformInterfaceComplementHistories(
      ctx.state(),
      document,
      missed,
    ),
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

  const newSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
    ...pointer.value,
    ...document.components.schemas,
  };
  return step(
    ctx,
    {
      ...document,
      components: {
        ...document.components,
        schemas: newSchemas,
      },
    },
    life - 1,
  );
}

const getMissed = (document: AutoBeOpenApi.IDocument): string[] => {
  const missed: Set<string> = new Set();
  const check = (name: string) => {
    if (document.components.schemas[name] === undefined) missed.add(name);
  };
  for (const op of document.operations) {
    if (op.requestBody !== null) check(op.requestBody.typeName);
    if (op.responseBody !== null) check(op.responseBody.typeName);
  }
  for (const value of Object.values(document.components.schemas))
    OpenApiTypeChecker.visit({
      components: document.components,
      schema: value,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          check(next.$ref.split("/").pop()!);
      },
    });
  return Array.from(missed);
};

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
    fixPageSchemas(next, "schemas");

    const result: IValidation<IAutoBeInterfaceComplementApplication.IProps> =
      typia.validate<IAutoBeInterfaceComplementApplication.IProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    validateAuthorizationSchema({
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
