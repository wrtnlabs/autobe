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
import { orchestrateInterfaceEndpointsReview } from "./orchestrateInterfaceEndpointsReview";
import { IAutoBeInterfaceEndpointApplication } from "./structures/IAutoBeInterfaceEndpointApplication";
import { OpenApiEndpointComparator } from "./utils/OpenApiEndpointComparator";

export async function orchestrateInterfaceEndpoints<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    groups: AutoBeInterfaceGroup[];
    authorizations: AutoBeOpenApi.IOperation[];
    instruction: string;
    message?: string;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const progress: AutoBeProgressEventBase = {
    total: props.groups.length,
    completed: 0,
  };
  const endpoints: AutoBeOpenApi.IEndpoint[] = (
    await executeCachedBatch(
      props.groups.map(
        (group) => (promptCacheKey) =>
          process(ctx, {
            group,
            authorizations: props.authorizations,
            instruction: props.instruction,
            message: props.message ?? "Make endpoints for the given assets.",
            progress,
            promptCacheKey,
          }),
      ),
    )
  ).flat();
  const deduplicated: AutoBeOpenApi.IEndpoint[] = new HashSet(
    endpoints,
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  ).toJSON();
  return orchestrateInterfaceEndpointsReview(ctx, deduplicated);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    group: AutoBeInterfaceGroup;
    message: string;
    progress: AutoBeProgressEventBase;
    authorizations: AutoBeOpenApi.IOperation[];
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> {
  const start: Date = new Date();
  const pointer: IPointer<AutoBeOpenApi.IEndpoint[] | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceEndpoints",
    histories: transformInterfaceEndpointHistories({
      state: ctx.state(),
      group: props.group,
      authorizations: props.authorizations,
      instruction: props.instruction,
    }),
    controller: createController({
      model: ctx.model,
      build: (endpoints) => {
        pointer.value ??= endpoints;
        pointer.value.push(...endpoints);
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    message: props.message,
  });
  if (pointer.value === null) throw new Error("Failed to generate endpoints."); // unreachable

  const event: AutoBeInterfaceEndpointsEvent = {
    type: "interfaceEndpoints",
    id: v7(),
    endpoints: new HashSet(
      pointer.value,
      OpenApiEndpointComparator.hashCode,
      OpenApiEndpointComparator.equals,
    ).toJSON(),
    tokenUsage,
    created_at: start.toISOString(),
    step: ctx.state().analyze?.step ?? 0,
    completed: ++props.progress.completed,
    total: props.progress.total,
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
