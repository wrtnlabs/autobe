import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { transformInterfaceSchemaHistories } from "./histories/transformInterfaceSchemaHistories";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";

export async function orchestrateInterfaceComponents<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  capacity: number = 12,
): Promise<AutoBeOpenApi.IComponents> {
  const typeNames: Set<string> = new Set();
  for (const op of operations) {
    if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
    if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
  }
  const matrix: string[][] = divideArray({
    array: Array.from(typeNames),
    capacity,
  });
  let progress: number = 0;

  const x: AutoBeOpenApi.IComponents = {
    schemas: {},
    authorization: ctx.state().analyze?.roles,
  };
  for (const y of await Promise.all(
    matrix.map(async (it) => {
      const row: AutoBeOpenApi.IComponents = await divideAndConquer(
        ctx,
        operations,
        it,
        3,
        (count) => {
          progress += count;
        },
      );
      ctx.dispatch({
        type: "interfaceComponents",
        components: row,
        completed: progress,
        total: typeNames.size,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      });
      return row;
    }),
  )) {
    Object.assign(x.schemas, y.schemas);
  }
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  typeNames: string[],
  retry: number,
  progress: (completed: number) => void,
): Promise<AutoBeOpenApi.IComponents> {
  const remained: Set<string> = new Set(typeNames);
  const components: AutoBeOpenApi.IComponents = {
    schemas: {},
  };
  for (let i: number = 0; i < retry; ++i) {
    if (remained.size === 0) break;
    const before: number = remained.size;
    const newbie: AutoBeOpenApi.IComponents = await forceRetry(() =>
      process(ctx, operations, components, remained),
    );
    for (const key of Object.keys(newbie.schemas)) {
      components.schemas[key] = newbie.schemas[key];
      remained.delete(key);
    }
    if (before - remained.size !== 0) progress(before - remained.size);
  }
  return components;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  oldbie: AutoBeOpenApi.IComponents,
  remained: Set<string>,
): Promise<AutoBeOpenApi.IComponents> {
  const pointer: IPointer<AutoBeOpenApi.IComponents | null> = {
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
    histories: transformInterfaceSchemaHistories(ctx.state(), operations),
    controllers: [
      createApplication({
        model: ctx.model,
        build: async (components) => {
          pointer.value ??= {
            schemas: {},
          };
          Object.assign(pointer.value.schemas, components.schemas);
        },
        pointer,
      }),
    ],
  });
  enforceToolCall(agentica);

  const already: string[] = Object.keys(oldbie.schemas);
  await agentica
    .conversate(
      [
        "Make type components please.",
        "",
        "Here is the list of request/response bodies' type names from",
        "OpenAPI operations. Make type components of them. If more object",
        "types are required during making the components, please make them",
        "too.",
        "",
        ...Array.from(remained).map((k) => `- \`${k}\``),
        ...(already.length !== 0
          ? [
              "",
              "> By the way, here is the list of components schemas what you've",
              "> already made. So, you don't need to make them again.",
              ">",
              ...already.map((k) => `> - \`${k}\``),
            ]
          : []),
      ].join("\n"),
    )
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["interface"]);
    });
  if (pointer.value === null) {
    // never be happened
    throw new Error("Failed to create components.");
  }
  return OpenApiV3_1Emender.convertComponents(
    pointer.value,
  ) as AutoBeOpenApi.IComponents;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (components: AutoBeOpenApi.IComponents) => Promise<void>;
  pointer: IPointer<AutoBeOpenApi.IComponents | null>;
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
      makeComponents: async (next) => {
        await props.build(next.components);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceSchemaApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceSchemaApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
