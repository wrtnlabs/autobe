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
  const refactors: AutoBeInterfaceSchemaRefactor[] = (
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
      const change = predicate(key);
      if (change !== null) {
        document.components.schemas[change(key)] = value;
        delete document.components.schemas[key];
      }
    }
  }
  for (const fn of $refChangers) fn();
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
