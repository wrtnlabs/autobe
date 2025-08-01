import { IAutoBeTokenUsageJson } from "@autobe/interface";

/**
 * A component of token usage for a specific agent or processing phase.
 *
 * @author @sunrabbit123
 * @example
 *   ```ts
 *   const component = new AutoBeTokenUsageComponent({
 *     total: 0,
 *     input: { total: 0, cached: 0 },
 *     output: { total: 0, reasoning: 0, accepted_prediction: 0, rejected_prediction: 0 },
 *   });
 *   ```;
 *
 * @implements {IAutoBeTokenUsageJson.IComponent}
 */
export class AutoBeTokenUsageComponent
  implements IAutoBeTokenUsageJson.IComponent
{
  total: number;
  input: IAutoBeTokenUsageJson.IInput;
  output: IAutoBeTokenUsageJson.IOutput;

  constructor(props?: IAutoBeTokenUsageJson.IComponent) {
    if (props === undefined) {
      this.total = 0;
      this.input = { total: 0, cached: 0 };
      this.output = {
        total: 0,
        reasoning: 0,
        accepted_prediction: 0,
        rejected_prediction: 0,
      };
      return;
    }
    this.total = props.total;
    this.input = props.input;
    this.output = props.output;
  }

  /**
   * Increment the token usage by the given component.
   *
   * @author @sunrabbit123
   * @example
   *   ```ts
   *   const component = new AutoBeTokenUsageComponent();
   *   component.increment({ total: 100, input: { total: 100, cached: 0 }, output: { total: 100, reasoning: 0, accepted_prediction: 0, rejected_prediction: 0 } });
   *   ```;
   *
   * @param props - The component to increment the token usage by.
   */
  increment(props: IAutoBeTokenUsageJson.IComponent) {
    this.total += props.total;
    this.input.total += props.input.total;
    this.input.cached += props.input.cached;
    this.output.total += props.output.total;
    this.output.reasoning += props.output.reasoning;
    this.output.accepted_prediction += props.output.accepted_prediction;
  }

  /**
   * Add the token usage of two components.
   *
   * @author @sunrabbit123
   * @example
   *   ```ts
   *   const component = AutoBeTokenUsageComponent.plus(componentA, componentB);
   *   ```;
   *
   * @param a - The first component to add.
   * @param b - The second component to add.
   */
  public static plus(
    a: AutoBeTokenUsageComponent,
    b: AutoBeTokenUsageComponent,
  ) {
    return new AutoBeTokenUsageComponent({
      total: a.total + b.total,
      input: {
        total: a.input.total + b.input.total,
        cached: a.input.cached + b.input.cached,
      },
      output: {
        total: a.output.total + b.output.total,
        reasoning: a.output.reasoning + b.output.reasoning,
        accepted_prediction:
          a.output.accepted_prediction + b.output.accepted_prediction,
        rejected_prediction:
          a.output.rejected_prediction + b.output.rejected_prediction,
      },
    });
  }

  /**
   * Convert the component to a JSON object.
   *
   * @author @sunrabbit123
   * @example
   *   ```ts
   *   const json = component.toJSON();
   *   ```;
   */
  public toJSON(): IAutoBeTokenUsageJson.IComponent {
    return {
      total: this.total,
      input: this.input,
      output: this.output,
    };
  }
}
