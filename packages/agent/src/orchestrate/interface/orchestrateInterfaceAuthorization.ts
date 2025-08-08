import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeAnalyzeRole, AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceAuthorizationHistories } from "./histories/transformInterfaceAuthorization";
import { IAutoBeInterfaceAuthorizationApplication } from "./structures/IAutoBeInterfaceAuthorizationApplication";

export async function orchestrateInterfaceAuthorization<
  Model extends ILlmSchema.Model,
>(ctx: AutoBeContext<Model>): Promise<AutoBeOpenApi.IOperation[]> {
  // const start: Date = new Date();

  const roles: AutoBeAnalyzeRole[] = ctx.state().analyze?.roles ?? [];

  const operations: AutoBeOpenApi.IOperation[] = [];

  let completed: number = 0;

  await Promise.all(
    roles.map(async (role) => {
      const authorization: IAutoBeInterfaceAuthorizationApplication.IProps =
        await process(ctx, role);

      operations.push(...authorization.operations);

      ctx.dispatch({
        type: "interfaceAuthorization",
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
): Promise<IAutoBeInterfaceAuthorizationApplication.IProps> {
  const pointer: IPointer<IAutoBeInterfaceAuthorizationApplication.IProps | null> =
    {
      value: null,
    };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "interfaceAuthorization",
    histories: transformInterfaceAuthorizationHistories(ctx.state(), role),
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
  build: (next: IAutoBeInterfaceAuthorizationApplication.IProps) => void;
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
    } satisfies IAutoBeInterfaceAuthorizationApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceAuthorizationApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceAuthorizationApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
