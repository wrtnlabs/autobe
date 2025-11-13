import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import {
  AutoBeOpenApiEndpointComparator,
  MapUtil,
  StringUtil,
} from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer, Pair } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformTestScenarioHistory } from "./histories/transformTestScenarioHistory";
import { orchestrateTestScenarioReview } from "./orchestrateTestScenarioReview";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";
import { IAutoBeTestScenarioAuthorizationActor } from "./structures/IAutoBeTestScenarioAuthorizationActor";
import { getPrerequisites } from "./utils/getPrerequisites";

export const orchestrateTestScenario = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  instruction: string,
): Promise<AutoBeTestScenario[]> => {
  const document: AutoBeOpenApi.IDocument | undefined =
    ctx.state().interface?.document;
  if (document === undefined) {
    throw new Error(
      "Cannot write test scenarios because these are no operations.",
    );
  }

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>(
      document.operations.map(
        (op) =>
          new Pair(
            {
              path: op.path,
              method: op.method,
            },
            op,
          ),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  const endpointNotFound: string = [
    `You have to select one of the endpoints below`,
    "",
    " method | path ",
    "--------|------",
    ...document.operations
      .map((op) => `\`${op.method}\` | \`${op.path}\``)
      .join("\n"),
  ].join("\n");

  const progress: AutoBeProgressEventBase = {
    total: document.operations.length,
    completed: 0,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    total: document.operations.length,
    completed: 0,
  };
  const exclude: IAutoBeTestScenarioApplication.IScenarioGroup[] = [];
  let include: AutoBeOpenApi.IOperation[] = [...document.operations];
  let trial: number = 0;

  do {
    const matrix: AutoBeOpenApi.IOperation[][] = divideArray({
      array: include,
      capacity: AutoBeConfigConstant.INTERFACE_CAPACITY,
    });
    await executeCachedBatch(
      matrix.map((include) => async (promptCacheKey) => {
        exclude.push(
          ...(await divideAndConquer(ctx, {
            dict,
            endpointNotFound,
            include,
            exclude: exclude.map((x) => x.endpoint),
            progress,
            reviewProgress,
            promptCacheKey,
            instruction,
          })),
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
    progress.total = include.length + exclude.length;
    reviewProgress.total = include.length + exclude.length;
  } while (include.length > 0 && ++trial < ctx.retry);

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
};

const divideAndConquer = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    endpointNotFound: string;
    include: AutoBeOpenApi.IOperation[];
    exclude: AutoBeOpenApi.IEndpoint[];
    progress: AutoBeProgressEventBase;
    reviewProgress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<IAutoBeTestScenarioApplication.IScenarioGroup[]> => {
  try {
    return await process(ctx, props);
  } catch {
    return [];
  }
};

const process = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    endpointNotFound: string;
    include: AutoBeOpenApi.IOperation[];
    exclude: AutoBeOpenApi.IEndpoint[];
    progress: AutoBeProgressEventBase;
    reviewProgress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<IAutoBeTestScenarioApplication.IScenarioGroup[]> => {
  const authorizations: AutoBeInterfaceAuthorization[] =
    ctx.state().interface?.authorizations ?? [];
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document!;
  const preliminary: AutoBePreliminaryController<"interfaceOperations"> =
    new AutoBePreliminaryController({
      application: typia.json.application<IAutoBeTestScenarioApplication>(),
      source: SOURCE,
      kinds: ["interfaceOperations"],
      state: ctx.state(),
      local: {
        interfaceOperations: (() => {
          const unique: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
            AutoBeOpenApiEndpointComparator.hashCode,
            AutoBeOpenApiEndpointComparator.equals,
          );
          for (const op of props.include) {
            unique.insert({ method: op.method, path: op.path });
            for (const pr of getPrerequisites({
              document,
              endpoint: op,
            }))
              unique.insert(pr.endpoint);
          }
          return unique
            .toJSON()
            .map((endpoint) =>
              document.operations.find(
                (op) =>
                  op.method === endpoint.method && op.path === endpoint.path,
              ),
            )
            .filter((op) => op !== undefined);
        })(),
      },
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeTestScenarioApplication.IScenarioGroup[]> = {
      value: [],
    };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        model: ctx.model,
        endpointNotFound: props.endpointNotFound,
        dict: props.dict,
        authorizations,
        preliminary,
        build: (next) => {
          next.scenarioGroups.forEach((sg) =>
            sg.scenarios.forEach((s) => {
              s.functionName = NamingConvention.snake(s.functionName);
            }),
          );
          pointer.value ??= [];
          pointer.value.push(...next.scenarioGroups);
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformTestScenarioHistory({
        state: ctx.state(),
        include: props.include,
        exclude: props.exclude,
        instruction: props.instruction,
        preliminary,
      }),
    });
    if (pointer.value !== null) {
      if (pointer.value.length === 0) return out(result)([]);
      props.progress.total = Math.max(
        props.progress.total,
        (props.progress.completed += pointer.value.length),
      );
      ctx.dispatch({
        type: SOURCE,
        id: v7(),
        metric: result.metric,
        tokenUsage: result.tokenUsage,
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
        completed: props.progress.completed,
        total: props.progress.total,
        step: ctx.state().interface?.step ?? 0,
        created_at: new Date().toISOString(),
      });
      return out(result)(
        await orchestrateTestScenarioReview(ctx, {
          instruction: props.instruction,
          groups: pointer.value,
          progress: props.reviewProgress,
        }),
      );
    }
    return out(result)(null);
  });
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  endpointNotFound: string;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  authorizations: AutoBeInterfaceAuthorization[];
  build: (next: IAutoBeTestScenarioApplication.IComplete) => void;
  preliminary: AutoBePreliminaryController<"interfaceOperations">;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        request: result.data.request,
      });

    // merge to unique scenario groups
    const scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[] =
      uniqueScenarioGroups(result.data.request.scenarioGroups);

    // validate endpoints
    const errors: IValidation.IError[] = [];
    scenarioGroups.forEach((group, i) => {
      if (props.dict.has(group.endpoint) === false)
        errors.push({
          value: group.endpoint,
          path: `$input.request.scenarioGroups[${i}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          description: props.endpointNotFound,
        });
      group.scenarios.forEach((s, j) => {
        s.dependencies.forEach((dep, k) => {
          if (props.dict.has(dep.endpoint) === false)
            errors.push({
              value: dep.endpoint,
              path: `$input.request.scenarioGroups[${i}].scenarios[${j}].dependencies[${k}].endpoint`,
              expected: "AutoBeOpenApi.IEndpoint",
              description: props.endpointNotFound,
            });
        });
      });
    });

    // Authentication Correction
    const entireRoles: Map<string, IAutoBeTestScenarioAuthorizationActor> =
      new Map();
    for (const authorization of props.authorizations) {
      for (const op of authorization.operations) {
        if (op.authorizationType === null) continue;
        const value: IAutoBeTestScenarioAuthorizationActor = MapUtil.take(
          entireRoles,
          authorization.name,
          () => ({
            name: authorization.name,
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
        // gather authorization actors
        const localRoles: Map<string, IAutoBeTestScenarioAuthorizationActor> =
          new Map();
        const add = (operation: AutoBeOpenApi.IOperation) => {
          const actor: string | null = operation.authorizationActor;
          if (actor === null) return;
          MapUtil.take(localRoles, actor, () => ({
            name: actor,
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

        // Single actor case - add join operation
        if (localRoles.size === 1) {
          const actor: IAutoBeTestScenarioAuthorizationActor = localRoles
            .values()
            .next().value!;
          if (actor.join === null) {
            const joinOperation: AutoBeOpenApi.IOperation | null =
              entireRoles.get(actor.name)?.join ?? null;
            if (joinOperation === null) throw new Error("Unreachable code");

            scenario.dependencies.push({
              endpoint: {
                method: joinOperation.method,
                path: joinOperation.path,
              },
              purpose: StringUtil.trim`
                Essential authentication prerequisite:
                This join operation (${joinOperation.method} ${joinOperation.path}) must be executed before any operations requiring '${actor.name}' actor authorization.
                It establishes the necessary user account and authentication context for the '${actor.name}' actor, enabling subsequent API calls that depend on this specific authorization level.
                Without this join operation, the main scenario endpoint and its dependencies will fail due to insufficient authentication credentials.
              `,
            });
          }
        }

        // Multiple actors case - add both join and login operations
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
                  This join operation (${joinOperation.method} ${joinOperation.path}) is required to establish a '${role.name}' actor user account in the system.
                  This scenario involves multiple authorization actors, requiring separate user accounts for each actor to properly test cross-actor interactions and authorization boundaries.
                  The join operation creates the foundational user identity that will be used throughout the test scenario for '${role.name}' specific operations.
                  This join operation is required for the '${role.name}' actor authentication.
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
                  Actor switching authentication:
                  This login operation (${loginOperation.method} ${loginOperation.path}) enables dynamic user actor switching during test execution for the '${role.name}' actor.
                  In scenarios with multiple actors, the test agent needs to authenticate as different users to simulate real-world multi-user interactions.
                  This login operation ensures proper session management and authorization context switching, allowing the test to validate permissions, access controls, and business logic that span across different user actors within a single test scenario.
                  This login operation may be required for user actor swapping between multiple actors.
                `,
              });
            }
          }
        }
      });
    });
    return errors.length === 0
      ? result
      : {
          success: false,
          data: result.data,
          errors,
        };
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") props.build(next.request);
      },
    } satisfies IAutoBeTestScenarioApplication,
  };
};

const uniqueScenarioGroups = (
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[],
): IAutoBeTestScenarioApplication.IScenarioGroup[] =>
  new HashMap(
    groups.map((g) => new Pair(g.endpoint, g)),
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  )
    .toJSON()
    .map((it) => it.second);

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioApplication, "chatgpt">({
      validate: {
        process: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioApplication, "claude">({
      validate: {
        process: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestScenarioApplication, "gemini">({
      validate: {
        process: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestScenarioApplication.IProps>;

const SOURCE = "testScenario" satisfies AutoBeEventSource;
