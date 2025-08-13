import { IAgenticaController } from "@agentica/core";
import { AutoBeAnalyzeRole, AutoBeOpenApi } from "@autobe/interface";
import { AutoBeInterfaceAuthorizationEvent } from "@autobe/interface/src/events/AutoBeInterfaceAuthorizationEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { IProgress } from "../internal/IProgress";
import { transformInterfaceAuthorizationsHistories } from "./histories/transformInterfaceAuthorizationsHistories";
import { IAutoBeInterfaceAuthorizationsApplication } from "./structures/IAutoBeInterfaceAuthorizationsApplication";

export async function orchestrateInterfaceAuthorizations<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeOpenApi.IOperation[]> {
  const roles: AutoBeAnalyzeRole[] = ctx.state().analyze?.roles ?? [];
  const progress: IProgress = {
    total: roles.length,
    completed: 0,
  };
  const operations: AutoBeOpenApi.IOperation[][] = await Promise.all(
    roles.map(async (role) => {
      const event: AutoBeInterfaceAuthorizationEvent = await process(
        ctx,
        role,
        progress,
      );
      ctx.dispatch(event);
      return event.operations;
    }),
  );
  return operations.flat();
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  role: AutoBeAnalyzeRole,
  progress: IProgress,
): Promise<AutoBeInterfaceAuthorizationEvent> {
  const pointer: IPointer<IAutoBeInterfaceAuthorizationsApplication.IProps | null> =
    {
      value: null,
    };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceAuthorization",
    histories: transformInterfaceAuthorizationsHistories(ctx.state(), role),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: "Create Authorization Operation for the given roles",
  });
  if (pointer.value === null)
    throw new Error("Failed to generate authorization operation.");

  return {
    type: "interfaceAuthorization",
    operations: pointer.value.operations,
    completed: ++progress.completed,
    tokenUsage,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
    total: progress.total,
  } satisfies AutoBeInterfaceAuthorizationEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeInterfaceAuthorizationsApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Create Authorization Interface",
    application,
    execute: {
      makeOperations: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceAuthorizationsApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceAuthorizationsApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceAuthorizationsApplication,
    "chatgpt"
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
