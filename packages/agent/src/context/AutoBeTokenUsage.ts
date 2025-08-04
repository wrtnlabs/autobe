import { IAutoBeTokenUsageJson } from "@autobe/interface";

import { AutoBeTokenUsageComponent } from "./AutoBeTokenUsageComponent";
import { IAutoBeApplication } from "./IAutoBeApplication";

/**
 * Comprehensive token usage tracker for the AutoBe vibe coding system.
 *
 * This class provides centralized tracking and management of token consumption
 * across all AI agents in the automated development pipeline. It captures
 * detailed token usage statistics for each processing phase - from initial
 * requirements analysis through final implementation - enabling cost
 * monitoring, performance optimization, and resource utilization analysis.
 *
 * The token usage data includes both input tokens (with cache efficiency) and
 * output tokens (with generation type breakdowns), providing insights into AI
 * processing efficiency and helping optimize the balance between computational
 * costs and output quality.
 *
 * @author SunRabbit123
 */
export class AutoBeTokenUsage implements IAutoBeTokenUsageJson {
  /**
   * Token usage for the facade agent orchestrating the entire pipeline.
   *
   * Tracks tokens consumed by the initial agent that coordinates and manages
   * the overall vibe coding process, including request parsing and response
   * orchestration.
   */
  public readonly facade: AutoBeTokenUsageComponent;

  /**
   * Token usage for the requirements analysis agent.
   *
   * Captures tokens used during the analysis phase where user requirements are
   * processed, understood, and transformed into structured specifications for
   * subsequent development phases.
   */
  public readonly analyze: AutoBeTokenUsageComponent;

  /**
   * Token usage for the Prisma database schema generation agent.
   *
   * Records tokens consumed while designing and generating database schemas,
   * including entity relationships, field definitions, and database-specific
   * optimizations.
   */
  public readonly prisma: AutoBeTokenUsageComponent;

  /**
   * Token usage for the API interface specification agent.
   *
   * Tracks tokens used in creating OpenAPI/Swagger specifications, defining
   * endpoints, request/response structures, and API documentation.
   */
  public readonly interface: AutoBeTokenUsageComponent;

  /**
   * Token usage for the test code generation agent.
   *
   * Monitors tokens consumed during automated test creation, including scenario
   * planning, test case generation, and end-to-end test implementation.
   */
  public readonly test: AutoBeTokenUsageComponent;

  /**
   * Token usage for the implementation realization agent.
   *
   * Captures tokens used in the final implementation phase where actual
   * business logic, controllers, services, and integration code are generated.
   */
  public readonly realize: AutoBeTokenUsageComponent;

  /**
   * Aggregated token usage statistics across all agents.
   *
   * Provides a unified view of token consumption by combining data from all
   * processing phases in the vibe coding pipeline. This computed property
   * dynamically calculates the sum of all agent components (facade, analyze,
   * prisma, interface, test, realize) whenever accessed, ensuring the aggregate
   * always reflects the current state of token usage.
   *
   * The aggregation performs element-wise addition across all token metrics,
   * including total counts, input breakdowns with cache statistics, and output
   * categorizations by generation type. This comprehensive view enables overall
   * cost assessment and resource utilization analysis for the entire automated
   * development session.
   */
  public get aggregate(): IAutoBeTokenUsageJson.IComponent {
    return AutoBeTokenUsage.keys()
      .reduce(
        (acc, cur) => AutoBeTokenUsageComponent.plus(acc, this[cur]),
        new AutoBeTokenUsageComponent(),
      )
      .toJSON();
  }

  /* -----------------------------------------------------------
    CONSTRUCTORS
  ----------------------------------------------------------- */
  /**
   * Default Constructor.
   *
   * Creates a new token usage tracker with all agent phases initialized to
   * empty components. Each component starts with zero values for all token
   * counters, providing a clean slate for tracking token consumption from the
   * beginning of a vibe coding session.
   */
  public constructor();

  /**
   * Binding Constructor.
   *
   * Creates a new instance that shares component references with the provided
   * AutoBeTokenUsage instance. This establishes a bound relationship where both
   * instances point to the same component objects. Any modifications to token
   * counts through either instance will be reflected in both, enabling shared
   * tracking across different contexts.
   *
   * @param bind Existing AutoBeTokenUsage instance to bind to
   */
  public constructor(bind: AutoBeTokenUsage);

  /**
   * Initializer Constructor.
   *
   * Reconstructs a token usage tracker from serialized JSON data. Creates new
   * AutoBeTokenUsageComponent instances for each agent phase, initializing them
   * with the corresponding values from the JSON structure. This enables
   * restoration of token usage state from persisted data or transmission
   * between different parts of the system.
   *
   * @param props Token usage data in JSON format
   */
  public constructor(props?: Omit<IAutoBeTokenUsageJson, "aggregate">);

  public constructor(
    props?: AutoBeTokenUsage | IAutoBeTokenUsageJson | undefined,
  ) {
    if (props === undefined) {
      this.facade = new AutoBeTokenUsageComponent();
      this.analyze = new AutoBeTokenUsageComponent();
      this.prisma = new AutoBeTokenUsageComponent();
      this.interface = new AutoBeTokenUsageComponent();
      this.test = new AutoBeTokenUsageComponent();
      this.realize = new AutoBeTokenUsageComponent();
      return;
    } else if (props instanceof AutoBeTokenUsage) {
      this.facade = props.facade;
      this.analyze = props.analyze;
      this.prisma = props.prisma;
      this.interface = props.interface;
      this.test = props.test;
      this.realize = props.realize;
    } else {
      this.facade = new AutoBeTokenUsageComponent(props.facade);
      this.analyze = new AutoBeTokenUsageComponent(props.analyze);
      this.prisma = new AutoBeTokenUsageComponent(props.prisma);
      this.interface = new AutoBeTokenUsageComponent(props.interface);
      this.test = new AutoBeTokenUsageComponent(props.test);
      this.realize = new AutoBeTokenUsageComponent(props.realize);
    }
  }

  /**
   * Serialize token usage data to JSON format.
   *
   * Converts the internal token usage representation to the standardized
   * IAutoBeTokenUsageJson format, suitable for persistence, transmission, or
   * external analysis. The serialized data maintains the complete structure
   * including all agent phases and detailed token breakdowns.
   *
   * @returns JSON representation of token usage statistics
   */
  public toJSON(): IAutoBeTokenUsageJson {
    return {
      aggregate: this.aggregate,
      facade: this.facade.toJSON(),
      analyze: this.analyze.toJSON(),
      prisma: this.prisma.toJSON(),
      interface: this.interface.toJSON(),
      test: this.test.toJSON(),
      realize: this.realize.toJSON(),
    };
  }

  /* -----------------------------------------------------------
    OPERATORS
  ----------------------------------------------------------- */
  /**
   * Record token usage for specific processing stages.
   *
   * Updates token consumption statistics for one or more agent phases based on
   * the provided usage data. This method allows selective recording of token
   * usage for specific stages, enabling fine-grained tracking during
   * multi-phase processing or when certain agents are invoked multiple times.
   *
   * @example
   *   ```ts
   *   tokenUsage.record(
   *     { total: 150, input: { total: 100, cached: 20 }, output: { total: 50, ... } },
   *     ['analyze', 'prisma']
   *   );
   *   ```;
   *
   * @param usage - Token usage component data to record
   * @param additionalStages - Array of stage names to update with the usage
   *   data
   */
  public record(
    usage: IAutoBeTokenUsageJson.IComponent,
    additionalStages: (keyof IAutoBeApplication)[] = [],
  ) {
    additionalStages.forEach((stage) => {
      this[stage].increment(usage);
    });
  }

  /**
   * Increment current token usage with data from another instance.
   *
   * Adds token usage statistics from another AutoBeTokenUsage instance to this
   * one, updating all agent phases simultaneously. This method is useful for
   * combining token usage from parallel processing, multiple runs, or when
   * aggregating statistics from distributed agent executions.
   *
   * @param usage - AutoBeTokenUsage instance to add to current statistics
   * @returns This instance for method chaining
   */
  public increment(usage: AutoBeTokenUsage) {
    AutoBeTokenUsage.keys().forEach((key) => {
      this[key].increment(usage[key]);
    });
    return this;
  }

  /**
   * Create a new instance combining token usage from two sources.
   *
   * Performs element-wise addition of token usage statistics from two
   * AutoBeTokenUsage instances, creating a new instance with the combined
   * totals. This static method is useful for aggregating token usage across
   * multiple vibe coding sessions or when merging statistics from different
   * execution contexts.
   *
   * @param usageA - First token usage instance
   * @param usageB - Second token usage instance
   * @returns New instance with combined token usage statistics
   */
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

  /**
   * Get all agent phase keys for iteration.
   *
   * Returns a readonly array of all agent phase names used in the vibe coding
   * system. This internal utility method ensures consistent iteration over all
   * token usage components when performing operations like aggregation or
   * serialization.
   *
   * @returns Readonly array of agent phase keys
   * @internal
   */
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
