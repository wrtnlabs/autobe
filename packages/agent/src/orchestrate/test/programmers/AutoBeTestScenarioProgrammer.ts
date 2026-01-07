import {
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, Pair } from "tstl";
import { IValidation } from "typia";

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
   * Validate test scenario complete request.
   *
   * Validates:
   *
   * - Scenario endpoint exists in document operations
   * - All dependency endpoints exist in document operations
   * - Applies authentication correction for authorization actors
   *
   * @param props - Validation configuration
   * @returns Array of validation errors (empty if valid)
   */
  export const validate = (props: {
    errors: IValidation.IError[];
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    authorizations: AutoBeInterfaceAuthorization[];
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
