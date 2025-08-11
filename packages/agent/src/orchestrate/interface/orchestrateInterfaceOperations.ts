import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { forceRetry } from "../../utils/forceRetry";
import { transformInterfaceOperationHistories } from "./histories/transformInterfaceOperationHistories";
import { orchestrateInterfaceOperationsReview } from "./orchestrateInterfaceOperationsReview";
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

  const state = {
    total: endpoints.length,
    completed: 0,
  } as const;

  const operations: AutoBeOpenApi.IOperation[] = (
    await Promise.all(
      matrix.map(async (it) => {
        const row: AutoBeOpenApi.IOperation[] = await divideAndConquer(
          ctx,
          endpoints,
          it,
          3,
          progress,
          state,
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
    )
  ).flat();

  return operations;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  total: AutoBeOpenApi.IEndpoint[],
  endpoints: AutoBeOpenApi.IEndpoint[],
  retry: number,
  progress: IProgress,
  state: { total: number; completed: number },
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

  const failure: HashMap<AutoBeOpenApi.IEndpoint, string> = new HashMap(
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  );

  for (let i: number = 0; i < retry; ++i) {
    if (remained.empty() === true || operations.size() >= endpoints.length)
      break;

    const newbies = await forceRetry(async () => {
      // History of reviews from previous attempts
      const passed: AutoBeOpenApi.IOperation[] = [];
      do {
        const targets = Array.from(remained).map((target) => ({
          ...target,
          failure: failure.has(target) ? failure.get(target) : null,
        }));

        const operations = await process(ctx, targets, progress);
        const reviews = await orchestrateInterfaceOperationsReview(ctx, {
          endpoints: total,
          operations: operations,
        });

        const completed = state.completed + reviews.passed.length;
        state.completed = completed;

        ctx.dispatch({
          type: "interfaceOperationsReview",
          completed: completed,
          total: total.length,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        });

        if (reviews.passed.length) {
          const endpoints = reviews.passed.map((p) => p.endpoint);
          const passedOperations = operations
            .filter((op) =>
              endpoints.some(
                (endpoint) =>
                  endpoint.method === op.method && endpoint.path === op.path,
              ),
            )
            .flatMap((op) => {
              return op.authorizationRoles.map((role) => {
                return {
                  ...op,
                  path: op.path,
                  authorizationRole: role,
                };
              });
            });

          passed.push(...passedOperations);

          // Remove passed endpoints from failure map
          endpoints.forEach((endpoint) => {
            remained.erase(endpoint);
            failure.erase(endpoint);
          });
        }

        if (reviews.failure.length === 0) {
          break;
        }

        reviews.failure.forEach((review) => {
          failure.set(review.endpoint, review.reason);
        });
      } while (true);

      const prefix: string = NamingConvention.camel(
        ctx.state().analyze!.prefix,
      );

      return passed.map((v) => {
        return {
          ...v,
          path: getPathname({
            path: v.path,
            prefix: prefix,
            role: v.authorizationRole,
          }),
        };
      });
    });

    newbies.forEach((newbie) => operations.set(newbie, newbie));
  }

  return operations.toJSON().map((it) => it.second);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: (AutoBeOpenApi.IEndpoint & { failure: string | null })[],
  progress: IProgress,
): Promise<IAutoBeInterfaceOperationApplication.IOperation[]> {
  const pointer: IPointer<
    IAutoBeInterfaceOperationApplication.IOperation[] | null
  > = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
    source: "interfaceOperations",
    histories: transformInterfaceOperationHistories(ctx.state(), endpoints),
    controller: createController({
      model: ctx.model,
      roles: ctx.state().analyze?.roles.map((it) => it.name) ?? [],
      build: (operations) => {
        pointer.value ??= [];
        const matrix: IAutoBeInterfaceOperationApplication.IOperation[][] =
          operations.map((op) => {
            return [
              {
                ...op,
                path: op.path,
                authorizationRole: null,
              },
            ];
          });
        progress.completed += matrix.flat().length;
        progress.total += matrix
          .filter((it) => it.length > 1)
          .map((it) => it.length - 1)
          .reduce((a, b) => a + b, 0);
        pointer.value.push(...matrix.flat());
      },
    }),
    enforceFunctionCall: true,
  });
  await agentica.conversate("Make API operations").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["interface"]);
  });
  if (pointer.value === null) throw new Error("Failed to create operations."); // never be happened
  return pointer.value;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  roles: string[];
  build: (
    operations: IAutoBeInterfaceOperationApplication.IOperation[],
  ) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationApplication.IProps> => {
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
  const application = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

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

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceOperationApplication, "chatgpt">({
      validate: {
        makeOperations: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceOperationApplication, "claude">({
      validate: {
        makeOperations: validate,
      },
    }),
};

interface IProgress {
  completed: number;
  total: number;
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceOperationApplication.IProps>;

const getPathname = (props: {
  prefix: string;
  role?: string | null;
  path: string;
}) => {
  if (props.role) {
    return (
      "/" +
      [props.prefix, props.role, ...props.path.split("/")]
        .filter((it) => it !== "")
        .join("/")
    );
  }
  return (
    "/" +
    [props.prefix, ...props.path.split("/")].filter((it) => it !== "").join("/")
  );
};
