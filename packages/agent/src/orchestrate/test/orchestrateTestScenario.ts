import { IAgenticaController } from "@agentica/core";
import {
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeEndpointComparator, MapUtil, StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { transformTestScenarioHistories } from "./histories/transformTestScenarioHistories";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";
import { IAutoBeTestScenarioAuthorizationRole } from "./structures/IAutoBeTestScenarioAuthorizationRole";

export async function orchestrateTestScenario<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestScenario[]> {
  const operations: AutoBeOpenApi.IOperation[] =
    ctx.state().interface?.document.operations ?? [];
  if (operations.length === 0) {
    throw new Error(
      "Cannot write test scenarios because these are no operations.",
    );
  }

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      operations.map(
        (op) =>
          new Pair(
            {
              path: op.path,
              method: op.method,
            },
            op,
          ),
      ),
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
    );

  const endpointNotFound: string = [
    `You have to select one of the endpoints below`,
    "",
    " method | path ",
    "--------|------",
    ...operations.map((op) => `\`${op.method}\` | \`${op.path}\``).join("\n"),
  ].join("\n");

  const progress: AutoBeProgressEventBase = {
    id: v7(),
    total: operations.length,
    completed: 0,
  };
  const exclude: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
  let include: AutoBeOpenApi.IOperation[] = Array.from(operations);

  do {
    const matrix: AutoBeOpenApi.IOperation[][] = divideArray({
      array: include,
      capacity: 5,
    });
    await Promise.all(
      matrix.map(async (include) => {
        exclude.push(
          ...(await divideAndConquer(
            ctx,
            dict,
            endpointNotFound,
            operations,
            include,
            exclude.map((x) => x.endpoint),
            progress,
          )),
        );
      }),
    );
    include = include.filter((op) => {
      if (
        exclude.some(
          (pg) =>
            pg.endpoint.method === op.method && pg.endpoint.path === op.path,
        )
      ) {
        return false;
      }
      return true;
    });
  } while (include.length > 0);

  return exclude.flatMap((pg) => {
    return pg.scenarios.map((plan) => {
      return {
        endpoint: pg.endpoint,
        draft: plan.draft,
        functionName: plan.functionName,
        dependencies: plan.dependencies,
      } satisfies AutoBeTestScenario;
    });
  });
}

const divideAndConquer = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>,
  endpointNotFound: string,
  entire: AutoBeOpenApi.IOperation[],
  include: AutoBeOpenApi.IOperation[],
  exclude: AutoBeOpenApi.IEndpoint[],
  progress: AutoBeProgressEventBase,
) => {
  const pointer: IPointer<IAutoBeTestScenarioApplication.IScenarioGroup[]> = {
    value: [],
  };

  const authorizations: AutoBeInterfaceAuthorization[] =
    ctx.state().interface?.authorizations ?? [];

  const { tokenUsage } = await ctx.conversate({
    source: "testScenarios",
    histories: transformTestScenarioHistories(
      ctx.state(),
      entire,
      include,
      exclude,
    ),
    controller: createController({
      model: ctx.model,
      endpointNotFound,
      dict,
      authorizations,
      build: (next) => {
        pointer.value ??= [];
        pointer.value.push(...next.scenarioGroups);
      },
    }),
    enforceFunctionCall: true,
    message: `Create e2e test scenarios.`,
  });
  if (pointer.value.length === 0) return [];
  ctx.dispatch({
    type: "testScenarios",
    id: progress.id,
    tokenUsage,
    scenarios: pointer.value
      .map((v) =>
        v.scenarios.map(
          (s) =>
            ({
              endpoint: v.endpoint,
              draft: s.draft,
              functionName: s.functionName,
              dependencies: s.dependencies,
            }) satisfies AutoBeTestScenario,
        ),
      )
      .flat(),
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
    created_at: new Date().toISOString(),
  });
  return pointer.value;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  endpointNotFound: string;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  authorizations: AutoBeInterfaceAuthorization[];
  build: (next: IAutoBeTestScenarioApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;

    // merge to unique scenario groups
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] =
      uniqueScenarioGroups(result.data.scenarioGroups);

    // validate endpoints
    const errors: IValidation.IError[] = [];
    scenarioGroups.forEach((group, i) => {
      if (props.dict.has(group.endpoint) === false)
        errors.push({
          value: group.endpoint,
          path: `$input.scenarioGroups[${i}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          description: props.endpointNotFound,
        });
      group.scenarios.forEach((s, j) => {
        s.dependencies.forEach((dep, k) => {
          if (props.dict.has(dep.endpoint) === false)
            errors.push({
              value: dep.endpoint,
              path: `$input.scenarioGroups[${i}].scenarios[${j}].dependencies[${k}].endpoint`,
              expected: "AutoBeOpenApi.IEndpoint",
              description: props.endpointNotFound,
            });
        });
      });
    });

    // Authentication Correction
    const entireRoles: Map<string, IAutoBeTestScenarioAuthorizationRole> =
      new Map();
    for (const authorization of props.authorizations) {
      for (const op of authorization.operations) {
        if (op.authorizationType === null) continue;
        const value: IAutoBeTestScenarioAuthorizationRole = MapUtil.take(
          entireRoles,
          authorization.role,
          () => ({
            name: authorization.role,
            join: null,
            login: null,
          }),
        );
        if (op.authorizationType === "join") value.join = op;
        else if (op.authorizationType === "login") value.login = op;
      }
    }

    scenarioGroups.forEach((group) => {
      if (props.dict.has(group.endpoint) === false) return;

      const operation: AutoBeOpenApi.IOperation = props.dict.get(
        group.endpoint,
      );
      group.scenarios.forEach((scenario) => {
        // gathere authorization roles
        const localRoles: Map<string, IAutoBeTestScenarioAuthorizationRole> =
          new Map();
        const add = (operation: AutoBeOpenApi.IOperation) => {
          const role: string | null = operation.authorizationRole;
          if (role === null) return;
          MapUtil.take(localRoles, role, () => ({
            name: role,
            join: null,
            login: null,
          }));
        };
        add(operation);
        scenario.dependencies.forEach((d) => {
          if (props.dict.has(d.endpoint) === false) return;
          const depOperation: AutoBeOpenApi.IOperation = props.dict.get(
            d.endpoint,
          );
          add(depOperation);
        });

        // Single role case - add join operation
        if (localRoles.size === 1) {
          const role: IAutoBeTestScenarioAuthorizationRole = localRoles
            .values()
            .next().value!;
          if (role.join === null) {
            const joinOperation: AutoBeOpenApi.IOperation | null =
              entireRoles.get(role.name)?.join ?? null;
            if (joinOperation === null) throw new Error("Unreachable code");

            scenario.dependencies.push({
              endpoint: {
                method: joinOperation.method,
                path: joinOperation.path,
              },
              purpose: StringUtil.trim`
                Essential authentication prerequisite: 
                This join operation (${joinOperation.method} ${joinOperation.path}) must be executed before any operations requiring '${role.name}' role authorization. 
                It establishes the necessary user account and authentication context for the '${role.name}' role, enabling subsequent API calls that depend on this specific authorization level. 
                Without this join operation, the main scenario endpoint and its dependencies will fail due to insufficient authentication credentials.
              `,
            });
          }
        }

        // Multiple roles case - add both join and login operations
        if (localRoles.size > 1) {
          for (const role of localRoles.values()) {
            if (role.join === null) {
              const joinOperation: AutoBeOpenApi.IOperation | null =
                entireRoles.get(role.name)?.join ?? null;
              if (joinOperation === null) throw new Error("Unreachable code");

              scenario.dependencies.push({
                endpoint: {
                  path: joinOperation.path,
                  method: joinOperation.method,
                },
                purpose: StringUtil.trim`
                  Multi-actor authentication setup: 
                  This join operation (${joinOperation.method} ${joinOperation.path}) is required to establish a '${role.name}' role user account in the system. 
                  This scenario involves multiple authorization roles, requiring separate user accounts for each role to properly test cross-role interactions and authorization boundaries. 
                  The join operation creates the foundational user identity that will be used throughout the test scenario for '${role.name}' specific operations.
                  This join operation is required for the '${role.name}' role authentication.
                `,
              });
            }
            if (role.login === null) {
              const loginOperation: AutoBeOpenApi.IOperation | null =
                entireRoles.get(role.name)?.login ?? null;
              if (loginOperation === null) throw new Error("Unreachable code");

              scenario.dependencies.push({
                endpoint: {
                  path: loginOperation.path,
                  method: loginOperation.method,
                },
                purpose: StringUtil.trim`
                  Role switching authentication: 
                  This login operation (${loginOperation.method} ${loginOperation.path}) enables dynamic user role switching during test execution for the '${role.name}' role. 
                  In scenarios with multiple actors, the test agent needs to authenticate as different users to simulate real-world multi-user interactions. 
                  This login operation ensures proper session management and authorization context switching, allowing the test to validate permissions, access controls, and business logic that span across different user roles within a single test scenario.
                  This login operation may be required for user role swapping between multiple actors.
                `,
              });
            }
          }
        }
      });
    });
    return errors.length === 0
      ? {
          success: true,
          data: {
            scenarioGroups,
          },
        }
      : {
          success: false,
          data: {
            scenarioGroups,
          },
          errors,
        };
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Make test plans",
    application,
    execute: {
      makeScenario: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeTestScenarioApplication,
  };
}

const uniqueScenarioGroups = (
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
): IAutoBeTestScenarioApplication.IScenarioGroup[] =>
  new HashMap(
    groups.map((g) => new Pair(g.endpoint, g)),
    AutoBeEndpointComparator.hashCode,
    AutoBeEndpointComparator.equals,
  )
    .toJSON()
    .map((it) => it.second);

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioApplication, "chatgpt">({
      validate: {
        makeScenario: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioApplication, "claude">({
      validate: {
        makeScenario: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestScenarioApplication.IProps>;
