import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceOperationsEvent,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeEndpointComparator, StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";
import { Escaper } from "typia/lib/utils/Escaper";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { emplaceMap } from "../../utils/emplaceMap";
import { transformInterfaceOperationHistories } from "./histories/transformInterfaceOperationHistories";
import { orchestrateInterfaceOperationsReview } from "./orchestrateInterfaceOperationsReview";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { OpenApiEndpointComparator } from "./utils/OpenApiEndpointComparator";

export async function orchestrateInterfaceOperations<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  capacity: number = 8,
): Promise<AutoBeOpenApi.IOperation[]> {
  const matrix: AutoBeOpenApi.IEndpoint[][] = divideArray({
    array: endpoints,
    capacity,
  });
  const operationsProgress: IProgress = {
    total: endpoints.length,
    completed: 0,
  };

  const operationsReviewProgress: IProgress = {
    total: endpoints.length,
    completed: 0,
  };

  const operations: AutoBeOpenApi.IOperation[] = (
    await Promise.all(
      matrix.map(async (it) => {
        const row: AutoBeOpenApi.IOperation[] = await divideAndConquer(
          ctx,
          it,
          3,
          operationsProgress,
          operationsReviewProgress,
        );
        return row;
      }),
    )
  ).flat();

  return operations;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
  retry: number,
  operationsProgress: IProgress,
  operationsReviewProgress: IProgress,
): Promise<AutoBeOpenApi.IOperation[]> {
  const remained: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
    endpoints,
    OpenApiEndpointComparator.hashCode,
    OpenApiEndpointComparator.equals,
  );
  const unique: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      OpenApiEndpointComparator.hashCode,
      OpenApiEndpointComparator.equals,
    );
  for (let i: number = 0; i < retry; ++i) {
    if (remained.empty() === true || unique.size() >= endpoints.length) break;
    const operations: AutoBeOpenApi.IOperation[] = await process(
      ctx,
      Array.from(remained),
      operationsProgress,
    );
    const newbie: AutoBeOpenApi.IOperation[] =
      await orchestrateInterfaceOperationsReview(
        ctx,
        operations,
        operationsReviewProgress,
      );
    for (const item of newbie) {
      unique.set(item, item);
      remained.erase(item);
    }
  }
  return unique.toJSON().map((it) => it.second);
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
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceOperations",
    histories: transformInterfaceOperationHistories(ctx.state(), endpoints),
    controller: createController({
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
    enforceFunctionCall: true,
    message: "Make API operations",
  });
  if (pointer.value === null) throw new Error("Failed to create operations."); // never be happened
  ctx.dispatch({
    type: "interfaceOperations",
    operations: pointer.value,
    tokenUsage,
    ...progress,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceOperationsEvent);
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
      // get method has request body
      if (op.method === "get" && op.requestBody !== null)
        errors.push({
          path: `$input.operations[${i}].requestBody`,
          expected:
            "GET method should not have request body. Change method, or re-design the operation.",
          value: op.requestBody,
        });
      // operation name
      if (Escaper.variable(op.name) === false)
        errors.push({
          path: `$input.operations[${i}].name`,
          expected: "<valid_variable_name>",
          value: op.name,
          description: StringUtil.trim`
            The operation name will be converted to the API controller method
            (function) name, so the operation.name must be a valid JavaScript 
            variable/function name.

            However, what you've configured value ${JSON.stringify(op.name)}
            is not a valid JavaScript variable/function name. Please change
            it to a valid variable/function name.
          `,
        });
      // validate roles
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

    // validate duplicated endpoints
    const endpoints: HashMap<AutoBeOpenApi.IEndpoint, number[]> = new HashMap(
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );
    operations.forEach((op, i) => {
      const key: AutoBeOpenApi.IEndpoint = {
        path: op.path,
        method: op.method,
      };
      const it = endpoints.find(key);
      if (it.equals(endpoints.end()) === false) {
        const indexes: number[] = it.second;
        errors.push({
          path: `$input.operations[${i}].{"path"|"method"}`,
          expected: "Unique endpoint (path and method)",
          value: key,
          description: [
            `Duplicated endpoint detected (method: ${op.method}, path: ${op.path}).`,
            "",
            "The duplicated endpoints of others are located in below accessors.",
            "Check them, and consider which operation endpoint would be proper to modify.",
            ...indexes.map(
              (idx) => `- $input.operations.[${idx}].{"path"|"method"}`,
            ),
          ].join("\n"),
        });
        indexes.push(i);
      } else endpoints.emplace(key, [i]);
    });

    // validate duplicated method names
    const accessors: Map<string, number[]> = new Map();
    operations.forEach((op, i) => {
      const key: string =
        op.path
          .split("/")
          .filter((e) => e[0] !== "{" && e.at(-1) !== "}")
          .filter((e) => e.length !== 0)
          .join(".") + `.${op.name}`;
      const indexes: number[] = emplaceMap(accessors, key, () => []);
      if (indexes.length !== 0) {
        errors.push({
          path: `$input.operations[${i}].name`,
          expected: "Unique name in the same accessor scope.",
          value: op.name,
          description: [
            `Duplicated operation accessor detected (name: ${op.name}, accessor: ${key}).`,
            "",
            "The operation name must be unique within the parent accessor.",
            "In other worlds, the operation accessor determined by the name",
            "must be unique in the OpenAPI document.",
            "",
            "Here is the list of elements of duplicated operation names.",
            "Check them, and consider which operation name would be proper to modify.",
            "",
            ...indexes
              .map((idx) => `- ${operations[idx].name} (accessor: ${key})`)
              .join("\n"),
          ].join("\n"),
        });
      }
      indexes.push(i);
    });

    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
    return result;
  };
  const application: ILlmApplication<Model> = collection[
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
