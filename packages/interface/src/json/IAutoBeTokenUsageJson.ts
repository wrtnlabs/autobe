export interface IAutoBeTokenUsageJson {
  /**
   * Aggregated token usage.
   */
  aggregate: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token uasge of initializer agent.
   */
  initialize: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of function selector agent.
   */
  select: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of function canceler agent.
   */
  cancel: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of function caller agent.
   */
  call: IAutoBeTokenUsageJson.IComponent;

  /**
   * Token usage of function calling describer agent.
   */
  describe: IAutoBeTokenUsageJson.IComponent;
}
export namespace IAutoBeTokenUsageJson {
  export interface IComponent {
    /**
     * Total token usage.
     */
    total: number;

    /**
     * Input token usage of detailed.
     */
    input: IInput;

    /**
     * Output token usage of detailed.
     */
    output: IOutput;
  }

  /**
   * Input token usage of detailed.
   */
  export interface IInput {
    /**
     * Total amount of input token uasge.
     */
    total: number;

    /**
     * Cached token usage.
     */
    cached: number;
  }

  /**
   * Output token usage of detailed.
   */
  export interface IOutput {
    /**
     * Total amount of output token usage.
     */
    total: number;

    /**
     * Reasoning token usage.
     */
    reasoning: number;

    /**
     * Prediction token usage.
     */
    accepted_prediction: number;

    /**
     * Rejected prediction token usage.
     */
    rejected_prediction: number;
  }
}
