import {
  AutoBeInterfaceSchemaRefactor,
  AutoBeOpenApi,
} from "@autobe/interface";
import { ILlmSchema, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
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
  const refactors: AutoBeInterfaceSchemaRefactor[] = (
    await executeCachedBatch(
      matrix.map(
        (typeNames) => (promptCacheKey) =>
          divideAndConquer(ctx, {
            tableNames,
            typeNames,
            promptCacheKey,
          }),
      ),
    )
  ).flat();

  const $refChangers: Array<() => void> = [];
  for (const rename of refactors) {
    const predicate = (current: string): ((str: string) => string) | null => {
      if (current === rename.from) return () => rename.to;
      else if (current.startsWith(`${rename.from}.`))
        return (str: string) => str.replace(`${rename.from}.`, `${rename.to}.`);
      else if (current === `IPage${rename.from}`)
        return () => `IPage${rename.to}`;
      else if (current.startsWith(`IPage${rename.from}.`))
        return (str: string) =>
          str.replace(`IPage${rename.from}.`, `IPage${rename.to}.`);
      return null;
    };
    for (const value of Object.values(document.components.schemas))
      OpenApiTypeChecker.visit({
        components: document.components,
        schema: value,
        closure: (schema) => {
          if (OpenApiTypeChecker.isReference(schema) === false) return;
          const current: string = schema.$ref.split("/").pop()!;
          const change = predicate(current);
          if (change !== null)
            $refChangers.push(() => {
              schema.$ref = `#/components/schemas/${change(current)}`;
            });
        },
      });
    for (const [key, value] of Object.entries(document.components.schemas)) {
      const chnage = predicate(key);
      if (chnage !== null) {
        delete document.components.schemas[key];
        document.components.schemas[chnage(key)] = value;
      }
    }
    for (const fn of $refChangers) fn();
  }
}

const divideAndConquer = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    tableNames: string[];
    typeNames: string[];
    promptCacheKey: string;
  },
): Promise<AutoBeInterfaceSchemaRefactor[]> => {};
