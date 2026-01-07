import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
  AutoBeTestScenarioReviewEvent,
} from "@autobe/interface";
import {
  AutoBeOpenApiEndpointComparator,
  MapUtil,
  StringUtil,
} from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer, Pair } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformTestScenarioHistory } from "./histories/transformTestScenarioHistory";
import { orchestrateTestScenarioReview } from "./orchestrateTestScenarioReview";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";
import { IAutoBeTestScenarioAuthorizationActor } from "./structures/IAutoBeTestScenarioAuthorizationActor";
import { getPrerequisites } from "./utils/getPrerequisites";

/**
 * Orchestrate test scenario generation for all API operations.
 *
 * Following the InterfacePrerequisite pattern:
 * - Generate one scenario per operation in parallel
 * - Review all generated scenarios in parallel
 * - Return final scenarios array
 *
 * @param ctx - AutoBe context
 * @param instruction - E2E-test-specific instructions from requirements
 * @returns Array of reviewed test scenarios
 */
export const orchestrateTestScenario = async (
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBeTestScenario[]> => {
  const document: AutoBeOpenApi.IDocument | undefined =
    ctx.state().interface?.document;
  if (document === undefined) {
    throw new Error(
      "Cannot write test scenarios because there are no operations.",
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

  const candidates: AutoBeOpenApi.IOperation[] = document.operations;
  const progress: AutoBeProgressEventBase = {
    total: candidates.length,
    completed: 0,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    total: candidates.length,
    completed: 0,
  };

  // Generate scenarios in parallel (one per operation)
  const generatedScenarios: Array<AutoBeTestScenario | null> =
    await executeCachedBatch(
      ctx,
      candidates.map((operation) => async (promptCacheKey) => {
        try {
          return await processGeneration(ctx, {
            dict,
            endpointNotFound,
            document,
            operation,
            progress,
            promptCacheKey,
            instruction,
          });
        } catch {
          return null;
        }
      }),
    );

  const validScenarios = generatedScenarios.filter((s) => s !== null);

  // Review all scenarios in parallel
  const reviewEvents: AutoBeTestScenarioReviewEvent[] =
    await orchestrateTestScenarioReview(ctx, {
      dict,
      document,
      scenarios: validScenarios,
      progress: reviewProgress,
      instruction,
    });

  // Return improved scenarios (or original if no improvements)
  return reviewEvents.map((event) => event.improved ?? event.original);
};

/**
 * Process single operation scenario generation.
 *
 * Following InterfacePrerequisite pattern:
 * - preliminary.orchestrate wrapper
 * - conversate with controller
 * - dispatch event
 * - return scenario
 */
async function processGeneration(
  ctx: AutoBeContext,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    endpointNotFound: string;
    document: AutoBeOpenApi.IDocument;
    operation: AutoBeOpenApi.IOperation;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeTestScenario | null> {
  const authorizations: AutoBeInterfaceAuthorization[] =
    ctx.state().interface?.authorizations ?? [];

  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeTestScenarioApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "interfaceOperations", "interfaceSchemas"],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
    },
    local: {
      interfaceOperations: (() => {
        const unique: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
          AutoBeOpenApiEndpointComparator.hashCode,
          AutoBeOpenApiEndpointComparator.equals,
        );
        unique.insert({
          method: props.operation.method,
          path: props.operation.path,
        });
        for (const pr of getPrerequisites({
          document: props.document,
          endpoint: props.operation,
        }))
          unique.insert(pr.endpoint);

        return unique
          .toJSON()
          .map((endpoint) =>
            props.document.operations.find(
              (op) =>
                op.method === endpoint.method && op.path === endpoint.path,
            ),
          )
          .filter((op) => op !== undefined);
      })(),
    },
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeTestScenario | null> = {
      value: null,
    };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        endpointNotFound: props.endpointNotFound,
        dict: props.dict,
        authorizations,
        preliminary,
        build: (scenario: AutoBeTestScenario) => {
          // Normalize function name to snake_case
          scenario.functionName = NamingConvention.snake(
            scenario.functionName,
          );
          pointer.value = scenario;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformTestScenarioHistory({
        state: ctx.state(),
        operation: props.operation,
        instruction: props.instruction,
        preliminary,
      }),
    });

    if (pointer.value === null) return out(result)(null);

    // Dispatch event
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      scenarios: [pointer.value],
      total: props.progress.total,
      completed: ++props.progress.completed,
      step: ctx.state().interface?.step ?? 0,
      created_at: new Date().toISOString(),
    });

    return out(result)(pointer.value);
  });
}

function createController(props: {
  endpointNotFound: string;
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  authorizations: AutoBeInterfaceAuthorization[];
  build: (scenario: AutoBeTestScenario) => void;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const scenario = result.data.request.scenario;
    const errors: IValidation.IError[] = [];

    // Validate endpoint exists
    if (!props.dict.has(scenario.endpoint)) {
      errors.push({
        value: scenario.endpoint,
        path: "$input.request.scenario.endpoint",
        expected: "AutoBeOpenApi.IEndpoint",
        description: props.endpointNotFound,
      });
    }

    // Validate all dependency endpoints exist
    scenario.dependencies.forEach((dep, idx) => {
      if (!props.dict.has(dep.endpoint)) {
        errors.push({
          value: dep.endpoint,
          path: `$input.request.scenario.dependencies[${idx}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          description: props.endpointNotFound,
        });
      }
    });

    // Authentication Correction
    if (props.dict.has(scenario.endpoint)) {
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

      const operation: AutoBeOpenApi.IOperation =
        props.dict.get(scenario.endpoint);

      // Gather authorization actors
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
        if (props.dict.has(d.endpoint)) {
          const depOperation: AutoBeOpenApi.IOperation =
            props.dict.get(d.endpoint);
          add(depOperation);
        }
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
    }

    return errors.length === 0
      ? result
      : {
          success: false,
          data: result.data,
          errors,
        };
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestScenarioApplication>({
      validate: {
        process: validate,
      },
    });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") {
          props.build(next.request.scenario);
        }
      },
    } satisfies IAutoBeTestScenarioApplication,
  };
}

const SOURCE = "testScenario" satisfies AutoBeEventSource;
