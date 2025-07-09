export interface IAutoBeRealizeCoderApplication {
  programing: (next: IAutoBeRealizeCoderApplication.IProps) => void;
}

export namespace IAutoBeRealizeCoderApplication {
  export interface IProps {
    result: RealizeCoderOutput;
  }

  /**
   * The result of the code generation step, representing a fully generated
   * TypeScript function.
   */
  export interface RealizeCoderOutput {
    /**
     * The name of the function to be generated.
     *
     * This name will be used as the function's identifier and as the export
     * name in the provider file.
     */
    functionName: string;

    /**
     * The raw TypeScript code string implementing the function.
     *
     * - The implementation must be valid TypeScript code.
     * - It should focus solely on the logic of the function.
     * - Import statements do **not** need to be included. They will be
     *   automatically inserted by the system.
     * - Any unused imports will be automatically removed by eslint.
     * - Type annotations (e.g. for parameters and return types) should be omitted
     *   if they can be inferred.
     */
    implementationCode: string;
  }
}
