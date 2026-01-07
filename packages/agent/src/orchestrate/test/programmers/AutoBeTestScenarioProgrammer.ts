import {
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, MapUtil, StringUtil } from "@autobe/utils";
import { HashMap, Pair } from "tstl";
import { IValidation } from "typia";

import { IAutoBeTestScenarioAuthorizationActor } from "../structures/IAutoBeTestScenarioAuthorizationActor";

export namespace AutoBeTestScenarioProgrammer {
  /**
   * Create a HashMap associating endpoints with operations.
   *
   * @param operations - Array of operations to associate
   * @returns HashMap with endpoint as key and operation as value
   */
  export const associate = (
    operations: AutoBeOpenApi.IOperation[],
  ): HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =>
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
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

  /**
   * Fulfill test scenario with missing authentication dependencies.
   *
   * Automatically adds missing authentication operations (join/login) to the
   * scenario's dependencies based on authorization actor requirements.
   *
   * Authentication correction rules:
   *
   * - Single actor: Adds join operation if missing
   * - Multiple actors: Adds join + login operations for each actor if missing
   *
   * This function mutates the scenario by appending to its dependencies array.
   *
   * @param props - Fulfillment configuration
   * @param props.dict - Endpoint to operation lookup map
   * @param props.authorizations - Available authorization configurations
   * @param props.operation - Target operation being tested
   * @param props.scenario - Scenario to fulfill (will be mutated)
   */
  export const fulfill = (props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    authorizations: AutoBeInterfaceAuthorization[];
    operation: AutoBeOpenApi.IOperation;
    scenario: AutoBeTestScenario;
  }): void => {
    // Build map of all authorization actors with their join/login operations
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

    // Gather authorization actors required by operation and its dependencies
    const localRoles: Map<string, IAutoBeTestScenarioAuthorizationActor> =
      new Map();

    // Add operation's authorization actor
    if (props.operation.authorizationActor !== null) {
      MapUtil.take(localRoles, props.operation.authorizationActor, () => ({
        name: props.operation.authorizationActor!,
        join: null,
        login: null,
      }));
    }

    // Check existing dependencies to track what's already included
    props.scenario.dependencies.forEach((d) => {
      if (props.dict.has(d.endpoint)) {
        const depOperation: AutoBeOpenApi.IOperation =
          props.dict.get(d.endpoint);

        // Track non-auth operation actors
        if (depOperation.authorizationActor !== null) {
          MapUtil.take(localRoles, depOperation.authorizationActor, () => ({
            name: depOperation.authorizationActor!,
            join: null,
            login: null,
          }));
        }

        // Track existing auth operations (join/login)
        if (depOperation.authorizationType !== null) {
          const actor = depOperation.authorizationActor;
          if (actor !== null) {
            const role = MapUtil.take(localRoles, actor, () => ({
              name: actor,
              join: null,
              login: null,
            }));
            if (depOperation.authorizationType === "join") {
              role.join = depOperation;
            } else if (depOperation.authorizationType === "login") {
              role.login = depOperation;
            }
          }
        }
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

        props.scenario.dependencies.push({
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

          props.scenario.dependencies.push({
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

          props.scenario.dependencies.push({
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
  };

  /**
   * Validate test scenario complete request.
   *
   * Validates:
   *
   * - Scenario endpoint matches target operation
   * - All dependency endpoints exist in document operations
   * - No self-referencing dependencies (operation depending on itself)
   *
   * Note: This function performs pure validation only. Call fulfill() before
   * validation to ensure authentication dependencies are present.
   *
   * @param props - Validation configuration
   */
  export const validate = (props: {
    errors: IValidation.IError[];
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    operation: AutoBeOpenApi.IOperation;
    scenario: AutoBeTestScenario;
    accessor: string;
  }): void => {
    if (
      AutoBeOpenApiEndpointComparator.equals(
        props.scenario.endpoint,
        props.operation,
      ) === false
    )
      props.errors.push({
        path: `${props.accessor}.endpoint`,
        expected: "AutoBeOpenApi.IEndpoint",
        value: props.scenario.endpoint,
      });
    props.scenario.dependencies.forEach((dep, j) => {
      if (props.dict.has(dep.endpoint) === false)
        props.errors.push({
          path: `${props.accessor}.dependencies[${j}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          value: dep.endpoint,
        });
      else if (
        AutoBeOpenApiEndpointComparator.equals(dep.endpoint, props.operation)
      )
        props.errors.push({
          path: `${props.accessor}.dependencies[${j}].endpoint`,
          expected: "AutoBeOpenApi.IEndpoint",
          value: dep.endpoint,
        });
    });
  };
}
