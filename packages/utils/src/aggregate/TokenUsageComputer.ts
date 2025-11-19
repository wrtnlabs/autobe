import { IAutoBeTokenUsageJson } from "@autobe/interface";

export namespace TokenUsageComputer {
  export const zero = (): IAutoBeTokenUsageJson.IComponent => ({
    total: 0,
    input: {
      total: 0,
      cached: 0,
    },
    output: {
      total: 0,
      reasoning: 0,
      accepted_prediction: 0,
      rejected_prediction: 0,
    },
  });

  export const plus = (
    x: IAutoBeTokenUsageJson.IComponent,
    y: IAutoBeTokenUsageJson.IComponent,
  ): IAutoBeTokenUsageJson.IComponent => ({
    total: x.total + y.total,
    input: {
      total: x.input.total + y.input.total,
      cached: x.input.cached + y.input.cached,
    },
    output: {
      total: x.output.total + y.output.total,
      reasoning: x.output.reasoning + y.output.reasoning,
      accepted_prediction:
        x.output.accepted_prediction + y.output.accepted_prediction,
      rejected_prediction:
        x.output.rejected_prediction + y.output.rejected_prediction,
    },
  });

  export const increment = (
    x: IAutoBeTokenUsageJson.IComponent,
    y: IAutoBeTokenUsageJson.IComponent,
  ): void => {
    x.total += y.total;
    x.input.total += y.input.total;
    x.input.cached += y.input.cached;
    x.output.total += y.output.total;
    x.output.reasoning += y.output.reasoning;
    x.output.accepted_prediction += y.output.accepted_prediction;
    x.output.rejected_prediction += y.output.rejected_prediction;
  };
}
