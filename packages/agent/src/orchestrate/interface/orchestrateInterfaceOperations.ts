import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { transformInterfaceOperationHistories } from "./histories/transformInterfaceOperationHistories";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { OpenApiEndpointComparator } from "./utils/OpenApiEndpointComparator";

export async function orchestrateInterfaceOperations<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  capacity: number = 12,
): Promise<AutoBeOpenApi.IOperation[]> {
  const matrix: AutoBeOpenApi.IEndpoint[][] = divideArray({
    array: endpoints,
    capacity,
  });
  const progress: IProgress = {
    total: endpoints.length,
    completed: 0,
  };
  const operations: AutoBeOpenApi.IOperation[][] = await Promise.all(
    matrix.map(async (it) => {
      const row: AutoBeOpenApi.IOperation[] = await divideAndConquer(
        ctx,
        it,
        3,
        progress,
      );
      ctx.dispatch({
        type: "interfaceOperations",
        operations: row,
        ...progress,
        step: ctx.state().analyze?.step ?? 0,
        created_at: new Date().toISOString(),
      });
      return row;
    }),
  );
  return operations.flat();
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  retry: number,
  progress: IProgress,
): Promise<AutoBeOpenApi.IOperation[]> {
  const remained: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
    endpoints,
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  );
  const operations: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      OpenApiEndpointComparator.hashCode,
      OpenApiEndpointComparator.equals,
    );
  for (let i: number = 0; i < retry; ++i) {
    if (remained.empty() === true || operations.size() >= endpoints.length)
      break;
    const newbie: AutoBeOpenApi.IOperation[] = await forceRetry(() =>
      process(ctx, Array.from(remained), progress),
    );
    for (const item of newbie) {
      operations.set(item, item);
      remained.erase(item);
    }
  }
  return operations.toJSON().map((it) => it.second);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  progress: IProgress,
): Promise<AutoBeOpenApi.IOperation[]> {
  const prefix: string = NamingConvention.camel(ctx.state().analyze!.prefix);
  const pointer: IPointer<AutoBeOpenApi.IOperation[] | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
    },
    histories: transformInterfaceOperationHistories(ctx.state(), endpoints),
    controllers: [
      createApplication({
        model: ctx.model,
        roles: ctx.state().analyze?.roles.map((it) => it.name) ?? [],
        build: (operations) => {
          pointer.value ??= [];
          const matrix: AutoBeOpenApi.IOperation[][] = operations.map((op) => {
            if (op.authorizationRoles.length === 0)
              return [
                {
                  ...op,
                  path:
                    "/" +
                    [prefix, ...op.path.split("/")]
                      .filter((it) => it !== "")
                      .join("/"),
                  authorizationRole: null,
                },
              ];
            return op.authorizationRoles.map((role) => ({
              ...op,
              path:
                "/" +
                [prefix, role, ...op.path.split("/")]
                  .filter((it) => it !== "")
                  .join("/"),
              authorizationRole: role,
            }));
          });
          progress.completed += matrix.flat().length;
          progress.total += matrix
            .filter((it) => it.length > 1)
            .map((it) => it.length - 1)
            .reduce((a, b) => a + b, 0);
          pointer.value.push(...matrix.flat());
        },
      }),
    ],
  });
  enforceToolCall(agentica);
  await agentica.conversate("Make API operations").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["interface"]);
  });
  if (pointer.value === null) throw new Error("Failed to create operations."); // never be happened
  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  roles: string[];
  build: (
    operations: IAutoBeInterfaceOperationApplication.IOperation[],
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  application.functions[0].validate = (next: unknown) => {
    const result: IValidation<IAutoBeInterfaceOperationApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationApplication.IProps>(next);
    if (result.success === false) return result;

    const operations: IAutoBeInterfaceOperationApplication.IOperation[] =
      result.data.operations;
    const errors: IValidation.IError[] = [];
    operations.forEach((op, i) => {
      if (op.method === "get" && op.requestBody !== null)
        errors.push({
          path: `$input.operations[${i}].requestBody`,
          expected:
            "GET method should not have request body. Change method, or re-design the operation.",
          value: op.requestBody,
        });
      if (props.roles.length === 0) op.authorizationRoles = [];
      else if (op.authorizationRoles.length !== 0 && props.roles.length !== 0)
        op.authorizationRoles.forEach((role, j) => {
          if (props.roles.includes(role) === true) return;
          errors.push({
            path: `$input.operations[${i}].authorizationRoles[${j}]`,
            expected: `null | ${props.roles.map((str) => JSON.stringify(str)).join(" | ")}`,
            description: [
              `Role "${role}" is not defined in the roles list.`,
              "",
              "Please select one of them below, or do not define (`null`):  ",
              "",
              ...props.roles.map((role) => `- ${role}`),
            ].join("\n"),
            value: role,
          });
        });
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
    return result;
  };
  return {
    protocol: "class",
    name: "interface",
    application,
    execute: {
      makeOperations: (next) => {
        props.build(next.operations);
      },
    } satisfies IAutoBeInterfaceOperationApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceOperationApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceOperationApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

interface IProgress {
  completed: number;
  total: number;
}
