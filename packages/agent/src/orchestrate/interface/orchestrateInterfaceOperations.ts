import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceOperationsEvent,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceOperationHistories } from "./histories/transformInterfaceOperationHistories";
import { orchestrateInterfaceOperationsReview } from "./orchestrateInterfaceOperationsReview";
import { IAutoBeInterfaceOperationApplication } from "./structures/IAutoBeInterfaceOperationApplication";
import { OperationValidator } from "./utils/OperationValidator";

export async function orchestrateInterfaceOperations<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    endpoints: AutoBeOpenApi.IEndpoint[];
    capacity?: number;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const matrix: AutoBeOpenApi.IEndpoint[][] = divideArray({
    array: props.endpoints,
    capacity: props.capacity ?? AutoBeConfigConstant.INTERFACE_CAPACITY,
  });
  const progress: AutoBeProgressEventBase = {
    total: matrix.flat().length,
    completed: 0,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    total: matrix.length,
    completed: 0,
  };
  return (
    await executeCachedBatch(
      matrix.map((it) => async (promptCacheKey) => {
        const row: AutoBeOpenApi.IOperation[] = await divideAndConquer(ctx, {
          endpoints: it,
          progress,
          reviewProgress,
          promptCacheKey,
          instruction: props.instruction,
        });
        return row;
      }),
    )
  ).flat();
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    endpoints: AutoBeOpenApi.IEndpoint[];
    progress: AutoBeProgressEventBase;
    reviewProgress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const remained: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
    props.endpoints,
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  );
  const unique: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
  for (let i: number = 0; i < ctx.retry; ++i) {
    if (remained.empty() === true || unique.size() >= props.endpoints.length)
      break;
    const operations: AutoBeOpenApi.IOperation[] = remained.size()
      ? await process(ctx, {
          endpoints: remained,
          progress: props.progress,
          promptCacheKey: props.promptCacheKey,
          instruction: props.instruction,
        })
      : [];

    for (const item of operations) {
      unique.set(item, item);
      remained.erase(item);
    }
  }
  const newbie: AutoBeOpenApi.IOperation[] =
    await orchestrateInterfaceOperationsReview(
      ctx,
      unique.toJSON().map((it) => it.second),
      props.reviewProgress,
    );
  for (const item of newbie) unique.set(item, item);
  return unique.toJSON().map((it) => it.second);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    endpoints: HashSet<AutoBeOpenApi.IEndpoint>;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeOpenApi.IOperation[]> {
  const prefix: string = NamingConvention.camel(ctx.state().analyze!.prefix);
  const pointer: IPointer<AutoBeOpenApi.IOperation[] | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "interfaceOperations",
    histories: transformInterfaceOperationHistories({
      state: ctx.state(),
      endpoints: props.endpoints.toJSON(),
      instruction: props.instruction,
    }),
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
                authorizationType: null,
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
            authorizationType: null,
          }));
        });
        pointer.value.push(...matrix.flat());
        props.progress.completed += matrix.flat().length;
        props.progress.total += operations
          .map((op) =>
            props.endpoints.has({ path: op.path, method: op.method })
              ? op.authorizationRoles.length === 0
                ? 0
                : op.authorizationRoles.length - 1
              : op.authorizationRoles.length,
          )
          .reduce((a, b) => a + b, 0);
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    message: "Make API operations",
  });
  if (pointer.value === null) throw new Error("Failed to create operations."); // never be happened

  ctx.dispatch({
    type: "interfaceOperations",
    id: v7(),
    operations: pointer.value,
    tokenUsage,
    ...props.progress,
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
    OperationValidator.validate({
      path: "$input.operations",
      errors,
      operations,
    });

    operations.forEach((op, i) => {
      // validate roles
      if (props.roles.length === 0) op.authorizationRoles = [];
      else if (op.authorizationRoles.length !== 0 && props.roles.length !== 0)
        op.authorizationRoles.forEach((role, j) => {
          if (props.roles.includes(role) === true) return;
          errors.push({
            path: `$input.operations[${i}].authorizationRoles[${j}]`,
            expected: `null | ${props.roles.map((str) => JSON.stringify(str)).join(" | ")}`,
            description: StringUtil.trim`
              Role "${role}" is not defined in the roles list.

              Please select one of them below, or do not define (\`null\`):  

              ${props.roles.map((role) => `- ${role}`).join("\n")}
            `,
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

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceOperationApplication.IProps>;
