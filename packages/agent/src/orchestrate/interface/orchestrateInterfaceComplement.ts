import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import {
  ILlmApplication,
  ILlmSchema,
  OpenApiTypeChecker,
} from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { transformInterfaceComplementHistories } from "./histories/transformInterfaceComplementHistories";
import { IAutoBeInterfaceComplementApplication } from "./structures/IAutoBeInterfaceComplementApplication";

export function orchestrateInterfaceComplement<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  life: number = 8,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  return forceRetry(() => step(ctx, document, life));
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  retry: number,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const missed: string[] = getMissed(document);
  if (missed.length === 0 || retry <= 0) {
    return document.components.schemas;
  }

  const pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
    histories: transformInterfaceComplementHistories(
      ctx.state(),
      document,
      missed,
    ),
    controllers: [
      createApplication({
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
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate("Fill missing schema types please").finally(() => {
    const tokenUsage = agentica.getTokenUsage();
    ctx.usage().record(tokenUsage, ["interface"]);
  });
  if (pointer.value === null) {
    // unreachable
    throw new Error(
      "Failed to fill missing schema types. No response from agentica.",
    );
  }
  ctx.dispatch({
    type: "interfaceComplement",
    missed,
    schemas: pointer.value,
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
    retry - 1,
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

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
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

const claude = typia.llm.application<
  IAutoBeInterfaceComplementApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceComplementApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
