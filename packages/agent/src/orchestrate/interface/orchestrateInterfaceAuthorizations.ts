import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeAnalyzeRole, AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceAuthorizationsHistories } from "./histories/transformInterfaceAuthorizationsHistories";
import { IAutoBeInterfaceAuthorizationsApplication } from "./structures/IAutoBeInterfaceAuthorizationsApplication";

export async function orchestrateInterfaceAuthorizations<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeOpenApi.IOperation[]> {
  // const start: Date = new Date();

  const roles: AutoBeAnalyzeRole[] = ctx.state().analyze?.roles ?? [];

  const operations: AutoBeOpenApi.IOperation[] = [];

  let completed: number = 0;

  await Promise.all(
    roles.map(async (role) => {
      const authorization: IAutoBeInterfaceAuthorizationsApplication.IProps =
        await process(ctx, role);

      operations.push(...authorization.operations);

      ctx.dispatch({
        type: "interfaceAuthorizations",
        operations: authorization.operations,
        completed: ++completed,
        created_at: new Date().toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        total: roles.length,
      });
    }),
  );

  return operations;
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  role: AutoBeAnalyzeRole,
): Promise<IAutoBeInterfaceAuthorizationsApplication.IProps> {
  const pointer: IPointer<IAutoBeInterfaceAuthorizationsApplication.IProps | null> =
    {
      value: null,
    };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "interfaceAuthorizations",
    histories: transformInterfaceAuthorizationsHistories(ctx.state(), role),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
  });
  await agentica.conversate(
    "Create Authorization Operation for the given roles",
  );

  if (pointer.value === null)
    throw new Error("Failed to generate authorization operation.");

  return pointer.value;
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
