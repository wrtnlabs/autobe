import { IAutoBeTokenUsageJson } from "@autobe/interface";

import { AutoBeTokenUsageComponent } from "./AutoBeTokenUsageComponent";
import { IAutoBeApplication } from "./IAutoBeApplication";

export class AutoBeTokenUsage {
  public readonly facade: AutoBeTokenUsageComponent;
  public readonly analyze: AutoBeTokenUsageComponent;
  public readonly prisma: AutoBeTokenUsageComponent;
  public readonly interface: AutoBeTokenUsageComponent;
  public readonly test: AutoBeTokenUsageComponent;
  public readonly realize: AutoBeTokenUsageComponent;

  public constructor(props?: IAutoBeTokenUsageJson) {
    if (props === undefined) {
      this.facade = new AutoBeTokenUsageComponent();
      this.analyze = new AutoBeTokenUsageComponent();
      this.prisma = new AutoBeTokenUsageComponent();
      this.interface = new AutoBeTokenUsageComponent();
      this.test = new AutoBeTokenUsageComponent();
      this.realize = new AutoBeTokenUsageComponent();
      return;
    }

    this.facade = new AutoBeTokenUsageComponent(props.facade);
    this.analyze = new AutoBeTokenUsageComponent(props.analyze);
    this.prisma = new AutoBeTokenUsageComponent(props.prisma);
    this.interface = new AutoBeTokenUsageComponent(props.interface);
    this.test = new AutoBeTokenUsageComponent(props.test);
    this.realize = new AutoBeTokenUsageComponent(props.realize);
  }

  /**
   * Unified token usage across all AI agents and processing phases.
   *
   * Provides the total token consumption for the entire vibe coding session,
   * combining all input and output tokens used by every agent throughout the
   * development pipeline. This aggregate view enables overall cost assessment
   * and resource utilization analysis for complete project automation.
   *
   * @author @sunrabbit123
   */
  public get aggregate(): IAutoBeTokenUsageJson.IComponent {
    return AutoBeTokenUsage.keys().reduce(
      (acc, cur) => AutoBeTokenUsageComponent.plus(acc, this[cur]),
      new AutoBeTokenUsageComponent(),
    );
  }

  public record(
    usage: IAutoBeTokenUsageJson.IComponent,
    additionalStages: (keyof IAutoBeApplication)[] = [],
  ) {
    additionalStages.forEach((stage) => {
      this[stage].increment(usage);
    });
  }

  public increment(usage: AutoBeTokenUsage) {
    AutoBeTokenUsage.keys().forEach((key) => {
      this[key].increment(usage[key]);
    });
    return this;
  }

  public static plus(usageA: AutoBeTokenUsage, usageB: AutoBeTokenUsage) {
    return new AutoBeTokenUsage({
      facade: AutoBeTokenUsageComponent.plus(usageA.facade, usageB.facade),
      analyze: AutoBeTokenUsageComponent.plus(usageA.analyze, usageB.analyze),
      prisma: AutoBeTokenUsageComponent.plus(usageA.prisma, usageB.prisma),
      interface: AutoBeTokenUsageComponent.plus(
        usageA.interface,
        usageB.interface,
      ),
      test: AutoBeTokenUsageComponent.plus(usageA.test, usageB.test),
      realize: AutoBeTokenUsageComponent.plus(usageA.realize, usageB.realize),
    });
  }

  public toJSON(): IAutoBeTokenUsageJson {
    return {
      facade: this.facade.toJSON(),
      analyze: this.analyze.toJSON(),
      prisma: this.prisma.toJSON(),
      interface: this.interface.toJSON(),
      test: this.test.toJSON(),
      realize: this.realize.toJSON(),
    };
  }

  /** @internal */
  private static keys() {
    return [
      "facade",
      "analyze",
      "prisma",
      "interface",
      "test",
      "realize",
    ] as const;
  }
}

// /** Type check statements */
// 1 as unknown as AutoBeTokenUsage satisfies {
//   [key in "facade" | keyof IAutoBeApplication]: AgenticaTokenUsage;
// };

// 1 as unknown as IAutoBeTokenUsageJson satisfies {
//   [key in "facade" | keyof IAutoBeApplication]: IAutoBeInternalTokenUsageJson;
// };

// 1 as unknown as IAutoBeInternalTokenUsageJson satisfies IAgenticaTokenUsageJson;
