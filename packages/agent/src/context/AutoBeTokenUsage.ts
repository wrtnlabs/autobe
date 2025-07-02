import { AgenticaTokenUsage, IAgenticaTokenUsageJson } from "@agentica/core";
import {
  IAutoBeInternalTokenUsageJson,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";

import { IAutoBeApplication } from "./IAutoBeApplication";

export class AutoBeTokenUsage {
  public readonly root: AgenticaTokenUsage;
  public readonly analyze: AgenticaTokenUsage;
  public readonly prisma: AgenticaTokenUsage;
  public readonly interface: AgenticaTokenUsage;
  public readonly test: AgenticaTokenUsage;
  public readonly realize: AgenticaTokenUsage;

  public constructor(props?: IAutoBeTokenUsageJson) {
    if (props === undefined) {
      this.root = new AgenticaTokenUsage();
      this.analyze = new AgenticaTokenUsage();
      this.prisma = new AgenticaTokenUsage();
      this.interface = new AgenticaTokenUsage();
      this.test = new AgenticaTokenUsage();
      this.realize = new AgenticaTokenUsage();
      return;
    }

    this.root = new AgenticaTokenUsage(props.root);
    this.analyze = new AgenticaTokenUsage(props.analyze);
    this.prisma = new AgenticaTokenUsage(props.prisma);
    this.interface = new AgenticaTokenUsage(props.interface);
    this.test = new AgenticaTokenUsage(props.test);
    this.realize = new AgenticaTokenUsage(props.realize);
  }

  public record(
    usage: AgenticaTokenUsage,
    additionalStages: (keyof IAutoBeApplication)[] = [],
  ) {
    this.root.increment(usage);
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
      root: AgenticaTokenUsage.plus(usageA.root, usageB.root),
      analyze: AgenticaTokenUsage.plus(usageA.analyze, usageB.analyze),
      prisma: AgenticaTokenUsage.plus(usageA.prisma, usageB.prisma),
      interface: AgenticaTokenUsage.plus(usageA.interface, usageB.interface),
      test: AgenticaTokenUsage.plus(usageA.test, usageB.test),
      realize: AgenticaTokenUsage.plus(usageA.realize, usageB.realize),
    });
  }

  public toJSON(): IAutoBeTokenUsageJson {
    return {
      root: this.root.toJSON(),
      analyze: this.analyze.toJSON(),
      prisma: this.prisma.toJSON(),
      interface: this.interface.toJSON(),
      test: this.test.toJSON(),
      realize: this.realize.toJSON(),
    };
  }

  /** @internal */
  private static keys(): ("root" | keyof IAutoBeApplication)[] {
    return ["root", "analyze", "prisma", "interface", "test", "realize"];
  }
}

/** Type check statements */
1 as unknown as AutoBeTokenUsage satisfies {
  [key in "root" | keyof IAutoBeApplication]: AgenticaTokenUsage;
};

1 as unknown as IAutoBeTokenUsageJson satisfies {
  [key in "root" | keyof IAutoBeApplication]: IAutoBeInternalTokenUsageJson;
};

1 as unknown as IAutoBeInternalTokenUsageJson satisfies IAgenticaTokenUsageJson;
