import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeEndpointComparator } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, IPointer, Pair } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { transformTestScenarioHistories } from "./histories/transformTestScenarioHistories";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";

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

  const authOperations: AutoBeOpenApi.IOperation[] = entire.filter(
    (op) => op.authorizationType === "join" || op.authorizationType === "login",
  );

  const { tokenUsage } = await ctx.conversate({
    source: "testScenarios",
    histories: transformTestScenarioHistories(entire, include, exclude),
    controller: createController({
      model: ctx.model,
      endpointNotFound,
      dict,
      authOperations,
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
  authOperations: AutoBeOpenApi.IOperation[];
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
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
    result.data.scenarioGroups.forEach((sg) => {
      const created = scenarioGroups.find(
        (el) =>
          el.endpoint.method === sg.endpoint.method &&
          el.endpoint.path === sg.endpoint.path,
      );
      if (created) {
        created.scenarios.push(...sg.scenarios);
      } else {
        scenarioGroups.push(sg);
      }
    });

    // validate endpoints
    const errors: IValidation.IError[] = [];

    // Authentication Validation
    scenarioGroups.forEach((group) => {
      // 1. Extract roleSet from endpoint and dependencies
      const roleSet = new Set<string>();
      const operation = props.dict.get(group.endpoint);
      if (operation.authorizationRole) {
        roleSet.add(operation.authorizationRole);
      }

      group.scenarios.forEach((scenario) => {
        scenario.dependencies.forEach((d) => {
          const depOperation = props.dict.get(d.endpoint);
          if (depOperation?.authorizationRole) {
            roleSet.add(depOperation.authorizationRole);
          }
        });

        // Single role case - add join operation
        if (roleSet.size === 1) {
          const role = Array.from(roleSet)[0];
          const joinOperation = props.authOperations.find(
            (op) =>
              op.authorizationRole &&
              roleSet.has(op.authorizationRole) &&
              op.authorizationType === "join",
          );
          if (joinOperation) {
            if (
              !scenario.dependencies.some(
                (d) =>
                  d.endpoint.method === joinOperation.method &&
                  d.endpoint.path === joinOperation.path,
              )
            ) {
              scenario.dependencies.push({
                endpoint: {
                  method: joinOperation.method,
                  path: joinOperation.path,
                },
                purpose: `Join operation required for ${role} role authentication`,
              });
            }
          }
        }

        // Multiple roles case - add both join and login operations
        if (roleSet.size > 1) {
          const roles = Array.from(roleSet);
          const operations = props.authOperations.filter(
            (op) => op.authorizationRole && roleSet.has(op.authorizationRole),
          );
          operations.forEach((op) => {
            if (
              !scenario.dependencies.some(
                (d) =>
                  d.endpoint.method === op.method &&
                  d.endpoint.path === op.path,
              )
            ) {
              let purpose = "";
              if (op.authorizationType === "join") {
                purpose = `Join operation required for ${op.authorizationRole} role authentication`;
              } else if (op.authorizationType === "login") {
                purpose = `Login operation required for user role swapping between multiple actors (${roles.join(", ")})`;
              } else {
                purpose = `Authentication operation for ${op.authorizationRole} role`;
              }

              scenario.dependencies.push({
                endpoint: {
                  method: op.method,
                  path: op.path,
                },
                purpose: purpose,
              });
            }
          });
        }
      });
    });

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
