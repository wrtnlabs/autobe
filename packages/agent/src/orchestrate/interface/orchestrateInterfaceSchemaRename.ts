import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceSchemaRefactor,
  AutoBeInterfaceSchemaRenameEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import {
  ILlmApplication,
  ILlmSchema,
  OpenApi,
  OpenApiTypeChecker,
} from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceSchemaRenameHistories } from "./histories/transformInterfaceSchemaRenameHistories";
import { IAutoBeInterfaceSchemaRenameApplication } from "./structures/IAutoBeInterfaceSchemaRenameApplication";

export async function orchestrateInterfaceSchemaRename<
  Mode extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Mode>,
  document: AutoBeOpenApi.IDocument,
  capacity: number = AutoBeConfigConstant.INTERFACE_CAPACITY * 10,
): Promise<void> {
  const tableNames: string[] = ctx
    .state()
    .prisma!.result.data.files.map((f) => f.models)
    .flat()
    .map((m) => m.name)
    .filter((m) => m.startsWith("mv_") === false);
  const entireTypeNames: Set<string> = new Set();
  for (let name of Object.keys(document.components.schemas)) {
    if (name.startsWith("IPage")) name = name.replace("IPage", "");
    name = name.split(".")[0];
    entireTypeNames.add(name);
  }

  const matrix: string[][] = divideArray({
    array: Array.from(entireTypeNames),
    capacity,
  });
  const progress: AutoBeProgressEventBase = {
    total: entireTypeNames.size,
    completed: 0,
  };
  const refactors: AutoBeInterfaceSchemaRefactor[] = Array.from(
    new Map(
      (
        await executeCachedBatch(
          matrix.map(
            (typeNames) => (promptCacheKey) =>
              divideAndConquer(ctx, {
                tableNames,
                typeNames,
                promptCacheKey,
                progress,
              }),
          ),
        )
      )
        .flat()
        .map((r) => [r.from, r]),
    ).values(),
  );
  orchestrateInterfaceSchemaRename.rename(document, refactors);
}
export namespace orchestrateInterfaceSchemaRename {
  export const rename = (
    document: AutoBeOpenApi.IDocument,
    refactors: AutoBeInterfaceSchemaRefactor[],
  ): void => {
    // REPLACE RULE
    const replace = (typeName: string): string | null => {
      // exact match
      const exact: AutoBeInterfaceSchemaRefactor | undefined = refactors.find(
        (r) => r.from === typeName,
      );
      if (exact !== undefined) return exact.to;

      // T.X match
      const prefix: AutoBeInterfaceSchemaRefactor | undefined = refactors.find(
        (r) => typeName.startsWith(`${r.from}.`),
      );
      if (prefix !== undefined)
        return typeName.replace(`${prefix.from}.`, `${prefix.to}.`);

      // IPageT exact match
      const pageExact: AutoBeInterfaceSchemaRefactor | undefined =
        refactors.find((r) => typeName === `IPage${r.from}`);
      if (pageExact !== undefined) return `IPage${pageExact.to}`;

      // IPageT.X match
      const pagePrefix: AutoBeInterfaceSchemaRefactor | undefined =
        refactors.find((r) => typeName.startsWith(`IPage${r.from}.`));
      if (pagePrefix !== undefined)
        return typeName.replace(
          `IPage${pagePrefix.from}.`,
          `IPage${pagePrefix.to}.`,
        );
      return null;
    };

    // JSON SCHEMA REFERENCES
    const $refChangers: Map<OpenApi.IJsonSchema, () => void> = new Map();
    for (const value of Object.values(document.components.schemas))
      OpenApiTypeChecker.visit({
        components: document.components,
        schema: value,
        closure: (schema) => {
          if (OpenApiTypeChecker.isReference(schema) === false) return;
          const x: string = schema.$ref.split("/").pop()!;
          const y: string | null = replace(x);
          if (y !== null)
            $refChangers.set(schema, () => {
              schema.$ref = `#/components/schemas/${y}`;
            });
        },
      });
    for (const fn of $refChangers.values()) fn();

    // COMPONENT SCHEMAS
    for (const x of Object.keys(document.components.schemas)) {
      const y: string | null = replace(x);
      if (y !== null) {
        document.components.schemas[y] = document.components.schemas[x];
        delete document.components.schemas[x];
      }
    }

    // OPERATIONS
    for (const op of document.operations) {
      if (op.requestBody)
        op.requestBody.typeName =
          replace(op.requestBody.typeName) ?? op.requestBody.typeName;
      if (op.responseBody)
        op.responseBody.typeName =
          replace(op.responseBody.typeName) ?? op.responseBody.typeName;
    }
  };
}

const divideAndConquer = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    tableNames: string[];
    typeNames: string[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeInterfaceSchemaRefactor[]> => {
  try {
    const pointer: IPointer<IAutoBeInterfaceSchemaRenameApplication.IProps | null> =
      {
        value: null,
      };
    const { tokenUsage } = await ctx.conversate({
      source: "interfaceSchemaRename",
      controller: createController<Model>(
        ctx.model,
        (value) => (pointer.value = value),
      ),
      histories: transformInterfaceSchemaRenameHistories(props),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      message: "Rename DTO type names for consistency and clarity.",
    });
    if (pointer.value === null) {
      props.progress.completed += props.typeNames.length;
      return [];
    }

    pointer.value.refactors = Array.from(
      new Map(
        pointer.value.refactors
          .filter((r) => r.from !== r.to)
          .map((r) => [r.from, r]),
      ).values(),
    );
    ctx.dispatch({
      type: "interfaceSchemaRename",
      id: v7(),
      refactors: pointer.value.refactors,
      total: props.progress.total,
      completed: (props.progress.completed += props.typeNames.length),
      tokenUsage,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaRenameEvent);
    return pointer.value.refactors;
  } catch {
    props.progress.completed += props.typeNames.length;
    return [];
  }
};

const createController = <Model extends ILlmSchema.Model>(
  model: Model,
  build: (value: IAutoBeInterfaceSchemaRenameApplication.IProps) => void,
): IAgenticaController.IClass<Model> => {
  assertSchemaModel(model);
  const application: ILlmApplication<Model> = collection[
    model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "SchemaRenamer",
    application,
    execute: {
      rename: (props) => {
        build(props);
      },
    } satisfies IAutoBeInterfaceSchemaRenameApplication,
  };
};

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceSchemaRenameApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBeInterfaceSchemaRenameApplication,
    "claude"
  >(),
};
