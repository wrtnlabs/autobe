import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { OpenApiEndpointComparator } from "./OpenApiEndpointComparator";
import { transformInterfaceHistories } from "./transformInterfaceHistories";

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
  let completed: number = 0;
  const operations: AutoBeOpenApi.IOperation[][] = await Promise.all(
    matrix.map(async (it) => {
      const row: AutoBeOpenApi.IOperation[] = await divideAndConquer(
        ctx,
        it,
        3,
        (count) => {
          completed += count;
        },
      );
      ctx.dispatch({
        type: "interfaceOperations",
        operations: row,
        completed,
        total: endpoints.length,
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
  progress: (completed: number) => void,
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
    const before: number = operations.size();
    const newbie: AutoBeOpenApi.IOperation[] = await forceRetry(() =>
      process(ctx, Array.from(remained)),
    );
    for (const item of newbie) {
      operations.set(item, item);
      remained.erase(item);
    }
    if (operations.size() - before !== 0) progress(operations.size() - before);
  }
  return operations.toJSON().map((it) => it.second);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  endpoints: AutoBeOpenApi.IEndpoint[],
): Promise<AutoBeOpenApi.IOperation[]> {
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
    histories: transformInterfaceHistories(
      ctx.state(),
      AutoBeSystemPromptConstant.INTERFACE_ENDPOINT,
    ),
    controllers: [
      createApplication({
        model: ctx.model,
        roles: ctx.state().analyze?.roles.map((it) => it.name) ?? null,
        build: (endpoints) => {
          pointer.value ??= [];
          pointer.value.push(...endpoints);
        },
      }),
    ],
  });
  enforceToolCall(agentica);
  await agentica
    .conversate(
      [
        "Make API operations for below endpoints:",
        "",
        "```json",
        JSON.stringify(Array.from(endpoints), null, 2),
        "```",
      ].join("\n"),
    )
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["interface"]);
    });
  if (pointer.value === null) throw new Error("Failed to create operations."); // never be happened
  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  roles: string[] | null;
  build: (operations: AutoBeOpenApi.IOperation[]) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  application.functions[0].validate = (next: unknown): IValidation => {
    const result: IValidation<IMakeOperationProps> =
      typia.validate<IMakeOperationProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    result.data.operations.forEach((op, i) => {
      if (op.method === "get" && op.requestBody !== null)
        errors.push({
          path: `operations[${i}].requestBody`,
          expected:
            "GET method should not have request body. Change method, or re-design the operation.",
          value: op.requestBody,
        });
      op.authorizationRoles?.forEach((role, j) => {
        if (props.roles === null) {
          op.authorizationRoles = null;
        }
        if (props.roles?.find((it) => it === role) === undefined)
          errors.push({
            path: `operations[${i}].authorizationRoles[${j}]`,
            expected: `undefined | ${props.roles?.join(" | ")}`,
            description: [
              `Role "${role}" is not defined in the roles list.`,
              "",
              "Please select one of them below, or do not define (undefined):  ",
              "",
              ...(props.roles ?? []).map((role) => `- ${role}`),
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
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

interface IApplication {
  /**
   * Generate detailed API operations from path/method combinations.
   *
   * This function creates complete API operations following REST principles and
   * quality standards. Each generated operation includes specification, path,
   * method, detailed multi-paragraph description, concise summary, parameters,
   * and appropriate request/response bodies.
   *
   * The function processes as many operations as possible in a single call,
   * with progress tracking to ensure iterative completion of all required
   * endpoints.
   *
   * @param props Properties containing the operations to generate.
   */
  makeOperations(props: IMakeOperationProps): void;
}

interface IMakeOperationProps {
  /**
   * Array of API operations to generate.
   *
   * Each operation in this array must include:
   *
   * - Specification: Detailed API specification with clear purpose and
   *   functionality
   * - Path: Resource-centric URL path (e.g., "/resources/{resourceId}")
   * - Method: HTTP method (get, post, put, delete, patch)
   * - Description: Extremely detailed multi-paragraph description referencing
   *   Prisma schema comments
   * - Summary: Concise one-sentence summary of the endpoint
   * - Parameters: Array of all necessary parameters with descriptions and schema
   *   definitions
   * - RequestBody: For POST/PUT/PATCH methods, with typeName referencing
   *   components.schemas
   * - ResponseBody: With typeName referencing appropriate response type
   *
   * All operations must follow strict quality standards:
   *
   * 1. Detailed descriptions referencing Prisma schema comments
   * 2. Accurate parameter definitions matching path parameters
   * 3. Appropriate request/response body type references
   * 4. Consistent patterns for CRUD operations
   *
   * For list retrievals (typically PATCH), include pagination, search, and
   * sorting. For detail retrieval (GET), return a single resource. For creation
   * (POST), use .ICreate request body. For modification (PUT), use .IUpdate
   * request body.
   */
  operations: AutoBeOpenApi.IOperation[];
}
