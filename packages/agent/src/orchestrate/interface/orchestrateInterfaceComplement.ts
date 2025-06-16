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
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceHistories } from "./transformInterfaceHistories";

export function orchestrateInterfaceComplement<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  retry: number = 8,
): Promise<AutoBeOpenApi.IComponents> {
  return step(ctx, document, retry);
}

async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  document: AutoBeOpenApi.IDocument,
  retry: number,
): Promise<AutoBeOpenApi.IComponents> {
  const missed: string[] = getMissed(document);
  if (missed.length === 0 || retry <= 0) return document.components;

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
    histories: [
      ...transformInterfaceHistories(
        ctx.state(),
        AutoBeSystemPromptConstant.INTERFACE_COMPLEMENT,
      ),
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: [
          "Here is the OpenAPI document what you've made:",
          "",
          "```json",
          JSON.stringify(document),
          "```",
        ].join("\n"),
      },
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: [
          "You have missed below schema types in the document.components.schemas:",
          "",
          ...missed.map((s) => `- ${s}`),
        ].join("\n"),
      },
    ],
    tokenUsage: ctx.usage(),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = (OpenApiV3_1Emender.convertComponents({
            schemas: next,
          }).schemas ?? {}) as Record<
            string,
            AutoBeOpenApi.IJsonSchemaDescriptive
          >;
        },
      }),
    ],
  });
  agentica.on("request", async (event) => {
    if (event.body.tools) {
      event.body.tool_choice = "required";
    }
  });

  await agentica.conversate("Fill missing schema types please");
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

  const newComponents: AutoBeOpenApi.IComponents = {
    schemas: {
      ...pointer.value,
      ...document.components.schemas,
    },
    authorization: document.components.authorization,
  };
  return step(
    ctx,
    {
      ...document,
      components: newComponents,
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
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  /**
   * Complements missing schema types
   *
   * This method fills in schema definitions that are referenced via $ref but
   * not yet defined in the `components.schemas` section. For example, if an API
   * operation references `{ "$ref": "#/components/schemas/UserProfile" }` but
   * `UserProfile` type is not defined in `components.schemas`, this method will
   * add the missing schema definition.
   *
   * This function is designed to be called via AI function calling mechanism to
   * ensure the OpenAPI document is complete and all referenced schemas are
   * properly defined.
   */
  complementComponents(props: IComplementComponentsProps): void;
}
interface IComplementComponentsProps {
  /**
   * A collection of missing schema definitions that need to be added to the
   * OpenAPI document's `components.schemas` section.
   *
   * This object contains schema definitions for types that are referenced but
   * not yet defined:
   *
   * - Key: Schema name (`string`): The name of the schema type that will be
   *   referenced in $ref statements
   * - Value: `AutoBeOpenApi.IJsonSchema` - The complete JSON Schema definition
   *   for that type
   *
   * Example structure:
   *
   * ```typescript
   * {
   *   "UserProfile": {
   *     "type": "object",
   *     "properties": {
   *       "id": { "type": "string" },
   *       "name": { "type": "string" },
   *       "email": { "type": "string", "format": "email" }
   *     },
   *     "required": ["id", "name", "email"]
   *   }
   * }
   * ```
   *
   * Each schema definition follows the JSON Schema specification and will be
   * directly inserted into the OpenAPI document's components.schemas section,
   * making them available for $ref references throughout the API
   * specification.
   */
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}
