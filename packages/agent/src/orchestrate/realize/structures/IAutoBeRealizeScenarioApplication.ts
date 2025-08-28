import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeTestFile,
} from "@autobe/interface";

export namespace IAutoBeRealizeScenarioApplication {
  export interface IProps {
    /** The OpenAPI operation to be realized. */
    operation: AutoBeOpenApi.IOperation;

    /**
     * The name of the function to be generated.
     *
     * Derived from the Swagger path and method. The function name must be
     * written in snake_case. It serves as the entry point in both code
     * generation and test code.
     *
     * Once the function is generated, the function name and file name will be
     * the same. The generated file will be located at
     * `src/providers/${function_name}.ts`.
     */
    functionName: string;

    /** For example, `src/providers/${function_name}.ts`. */
    location: string;

    /**
     * List of scenario descriptions for test code generation.
     *
     * Each scenario describes the expected behavior of the function under
     * certain conditions. Used as a basis for TDD-style automated test
     * generation.
     */
    testFiles: AutoBeTestFile[];

    /**
     * Optional decorator event for customizing code generation behavior.
     *
     * Provides additional metadata or instructions that can modify how the
     * function implementation is generated. Can include custom annotations,
     * middleware configurations, or special handling directives that affect the
     * final code output.
     */
    decoratorEvent?: AutoBeRealizeAuthorization;
  }
}
