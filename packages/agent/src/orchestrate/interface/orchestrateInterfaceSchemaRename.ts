import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceSchemaRefactor,
  AutoBeInterfaceSchemaRenameEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, OpenApi, OpenApiTypeChecker } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceSchemaRenameHistory } from "./histories/transformInterfaceSchemaRenameHistory";
import { IAutoBeInterfaceSchemaRenameApplication } from "./structures/IAutoBeInterfaceSchemaRenameApplication";

export async function orchestrateInterfaceSchemaRename(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
  },
  capacity: number = AutoBeConfigConstant.INTERFACE_CAPACITY * 10,
): Promise<void> {
  const tableNames: string[] = ctx
    .state()
    .database!.result.data.files.map((f) => f.models)
    .flat()
    .map((m) => m.name)
    .filter((m) => m.startsWith("mv_") === false);

  const entireTypeNames: Set<string> = new Set();
  const insert = (key: string) => {
    if (key.startsWith("IPage")) key = key.replace("IPage", "");
    key = key.split(".")[0];
    entireTypeNames.add(key);
  };

  for (const key of Object.keys(props.document.components.schemas)) insert(key);

  const matrix: string[][] = divideArray({
    array: Array.from(entireTypeNames),
    capacity,
  });
  props.progress.total += matrix.length;

  const refactors: AutoBeInterfaceSchemaRefactor[] = uniqueRefactors(
    (
      await executeCachedBatch(
        ctx,
        matrix.map(
          (typeNames) => (promptCacheKey) =>
            divideAndConquer(ctx, {
              tableNames,
              typeNames,
              promptCacheKey,
              progress: props.progress,
            }),
        ),
      )
    ).flat(),
  );
  orchestrateInterfaceSchemaRename.rename(props.document, refactors);
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

const divideAndConquer = async (
  ctx: AutoBeContext,
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
    const { metric, tokenUsage } = await ctx.conversate({
      source: SOURCE,
      controller: createController((value) => (pointer.value = value)),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformInterfaceSchemaRenameHistory(props),
    });
    if (pointer.value === null) {
      ++props.progress.completed;
      return [];
    }

    pointer.value.refactors = uniqueRefactors(pointer.value.refactors);
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      refactors: pointer.value.refactors,
      total: props.progress.total,
      completed: ++props.progress.completed,
      metric,
      tokenUsage,
      created_at: new Date().toISOString(),
    } satisfies AutoBeInterfaceSchemaRenameEvent);
    return pointer.value.refactors;
  } catch {
    ++props.progress.completed;
    return [];
  }
};

const uniqueRefactors = (
  refactors: AutoBeInterfaceSchemaRefactor[],
): AutoBeInterfaceSchemaRefactor[] => {
  // Remove self-references (A->A)
  refactors = refactors.filter((r) => r.from !== r.to);

  // Remove duplicates (keep the first occurrence)
  refactors = Array.from(new Map(refactors.map((r) => [r.from, r])).values());

  // Build adjacency map: from -> to
  const renameMap: Map<string, string> = new Map();
  for (const r of refactors) {
    renameMap.set(r.from, r.to);
  }

  // Resolve transitive chains: A->B, B->C becomes A->C
  const resolveChain = (from: string): string => {
    const visited: Set<string> = new Set();
    let current: string = from;

    while (renameMap.has(current)) {
      // Cycle detection: A->B, B->C, C->A
      if (visited.has(current)) {
        // Cycle detected, keep the last valid mapping before cycle
        return current;
      }
      visited.add(current);
      current = renameMap.get(current)!;
    }
    return current;
  };

  // Build final refactor list with resolved chains
  const resolved: Map<string, AutoBeInterfaceSchemaRefactor> = new Map();
  for (const from of renameMap.keys()) {
    const finalTo: string = resolveChain(from);
    // Only include if actually changes
    if (from !== finalTo) {
      resolved.set(from, {
        from,
        to: finalTo,
      });
    }
  }
  return Array.from(resolved.values());
};

const createController = (
  build: (value: IAutoBeInterfaceSchemaRenameApplication.IProps) => void,
): IAgenticaController.IClass => {
  const application: ILlmApplication =
    typia.llm.application<IAutoBeInterfaceSchemaRenameApplication>();
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      rename: (props) => {
        build(props);
      },
    } satisfies IAutoBeInterfaceSchemaRenameApplication,
  };
};

const SOURCE = "interfaceSchemaRename" satisfies AutoBeEventSource;
