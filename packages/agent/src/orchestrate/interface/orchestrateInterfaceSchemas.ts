import { IAgenticaController } from "@agentica/core";
import { AutoBeInterfaceSchemasEvent, AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { OpenApiV3_1Emender } from "@samchon/openapi/lib/converters/OpenApiV3_1Emender";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { IProgress } from "../internal/IProgress";
import { transformInterfaceSchemaHistories } from "./histories/transformInterfaceSchemaHistories";
import { orchestrateInterfaceSchemasReview } from "./orchestrateInterfaceSchemasReview";
import { IAutoBeInterfaceSchemaApplication } from "./structures/IAutoBeInterfaceSchemaApplication";

export async function orchestrateInterfaceSchemas<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  capacity: number = 12,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const typeNames: Set<string> = new Set();
  for (const op of operations) {
    if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
    if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
  }
  const matrix: string[][] = divideArray({
    array: Array.from(typeNames),
    capacity,
  });
  const progress: IProgress = {
    total: typeNames.size,
    completed: 0,
  };
  const reviewProgress: IProgress = {
    total: matrix.length,
    completed: 0,
  };
  const x: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (const y of await Promise.all(
    matrix.map(async (it) => {
      const row: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
        await divideAndConquer(ctx, operations, it, 3, progress);
      return orchestrateInterfaceSchemasReview(
        ctx,
        operations,
        row,
        reviewProgress,
      );
    }),
  )) {
    Object.assign(x, y);
  }
  return x;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  typeNames: string[],
  retry: number,
  progress: IProgress,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const remained: Set<string> = new Set(typeNames);
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
  for (let i: number = 0; i < retry; ++i) {
    if (remained.size === 0) break;
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      await process(ctx, operations, schemas, remained, progress);
    for (const key of Object.keys(newbie)) {
      schemas[key] = newbie[key];
      remained.delete(key);
    }
  }
  return schemas;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  oldbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  remained: Set<string>,
  progress: IProgress,
): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> {
  const already: string[] = Object.keys(oldbie);
  const pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceSchemas",
    histories: transformInterfaceSchemaHistories(ctx.state(), operations),
    controller: createController({
      model: ctx.model,
      build: async (next) => {
        pointer.value ??= {};
        Object.assign(pointer.value, next);
      },
      pointer,
    }),
    enforceFunctionCall: true,
    message: [
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
  });
  if (pointer.value === null) throw new Error("Failed to create components.");

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    (
      OpenApiV3_1Emender.convertComponents({
        schemas: pointer.value,
      }) as AutoBeOpenApi.IComponents
    ).schemas ?? {};
  ctx.dispatch({
    type: "interfaceSchemas",
    schemas,
    tokenUsage,
    completed: (progress.completed += Object.keys(schemas).filter(
      (k) => oldbie[k] === undefined,
    ).length),
    total: progress.total,
    step: ctx.state().prisma?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceSchemasEvent);
  return schemas;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (
    next: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ) => Promise<void>;
  pointer: IPointer<Record<
    string,
    AutoBeOpenApi.IJsonSchemaDescriptive
  > | null>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      makeComponents: async (next) => {
        await props.build(next.schemas);
      },
    } satisfies IAutoBeInterfaceSchemaApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceSchemaApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceSchemaApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
