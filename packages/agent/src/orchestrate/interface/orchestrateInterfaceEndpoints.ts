import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceEndpointsEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeInterfaceGroup } from "@autobe/interface/src/histories/contents/AutoBeInterfaceGroup";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { HashSet, IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceEndpointHistories } from "./histories/transformInterfaceEndpointHistories";
import { IAutoBeInterfaceEndpointApplication } from "./structures/IAutoBeInterfaceEndpointApplication";
import { OpenApiEndpointComparator } from "./utils/OpenApiEndpointComparator";

export async function orchestrateInterfaceEndpoints<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  groups: AutoBeInterfaceGroup[],
  authorizations: AutoBeOpenApi.IOperation[],
  content: string = `Make endpoints for the given assets`,
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const progressId: string = v7();
  const progress: AutoBeProgressEventBase = {
    total: groups.length,
    completed: 0,
  };
  const endpoints: AutoBeOpenApi.IEndpoint[] = (
    await executeCachedBatch(
      groups.map(
        (g) => () =>
          process(ctx, g, content, progress, authorizations, progressId),
      ),
    )
  ).flat();
  return new HashSet(
    endpoints,
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  ).toJSON();
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  group: AutoBeInterfaceGroup,
  message: string,
  progress: AutoBeProgressEventBase,
  authorizations: AutoBeOpenApi.IOperation[],
  progressId: string,
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const start: Date = new Date();
  const pointer: IPointer<AutoBeOpenApi.IEndpoint[] | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceEndpoints",
    histories: transformInterfaceEndpointHistories(
      ctx.state(),
      group,
      authorizations,
    ),
    controller: createController({
      model: ctx.model,
      build: (endpoints) => {
        pointer.value ??= endpoints;
        pointer.value.push(...endpoints);
      },
    }),
    enforceFunctionCall: true,
    message,
  });
  if (pointer.value === null) throw new Error("Failed to generate endpoints."); // unreachable

  const event: AutoBeInterfaceEndpointsEvent = {
    type: "interfaceEndpoints",
    id: progressId,
    endpoints: new HashSet(
      pointer.value,
      OpenApiEndpointComparator.hashCode,
      OpenApiEndpointComparator.equals,
    ).toJSON(),
    tokenUsage,
    created_at: start.toISOString(),
    step: ctx.state().analyze?.step ?? 0,
    completed: ++progress.completed,
    total: progress.total,
  };
  ctx.dispatch(event);
  return pointer.value;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (endpoints: AutoBeOpenApi.IEndpoint[]) => void;
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
      makeEndpoints: (next) => {
        props.build(next.endpoints);
      },
    } satisfies IAutoBeInterfaceEndpointApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceEndpointApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceEndpointApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
