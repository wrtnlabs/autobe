import {
  AutoBeAggregateEventBase,
  AutoBePhase,
  AutoBeProcessAggregate,
  AutoBeProcessAggregateCollection,
} from "@autobe/interface";

import { AutoBeFunctionCallingMetricFactory } from "./AutoBeFunctionCallingMetricFactory";
import { TokenUsageComputer } from "./TokenUsageComputer";

export namespace AutoBeProcessAggregateFactory {
  export const createAggregate = (): AutoBeProcessAggregate => ({
    metric: AutoBeFunctionCallingMetricFactory.create(),
    tokenUsage: {
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
    },
  });

  export const createCollection = <
    Phase extends AutoBePhase | "all",
  >(): AutoBeProcessAggregateCollection<Phase> =>
    ({
      total: createAggregate(),
    }) satisfies AutoBeProcessAggregateCollection as AutoBeProcessAggregateCollection<Phase>;

  export const computeTotal = <Phase extends AutoBePhase | "all">(
    collection: AutoBeProcessAggregateCollection<Phase>,
  ): AutoBeProcessAggregate => {
    const total: AutoBeProcessAggregate = createAggregate();
    for (const [key, value] of Object.entries(collection)) {
      if (key === "total") continue;
      AutoBeFunctionCallingMetricFactory.increment(total.metric, value.metric);
      TokenUsageComputer.increment(total.tokenUsage, value.tokenUsage);
    }
    return total;
  };

  export const emplaceEvent = <
    Event extends AutoBeAggregateEventBase & {
      type: string;
    },
  >(
    collection: AutoBeProcessAggregateCollection,
    event: Event,
  ): void => {
    (collection as any)[event.type] ??= createAggregate();
    collection.total ??= computeTotal(collection);

    const local: AutoBeProcessAggregate = (collection as any)[
      event.type
    ] as AutoBeProcessAggregate;
    const total: AutoBeProcessAggregate = collection.total;

    AutoBeFunctionCallingMetricFactory.increment(local.metric, event.metric);
    AutoBeFunctionCallingMetricFactory.increment(total.metric, event.metric);
    TokenUsageComputer.increment(local.tokenUsage, event.tokenUsage);
    TokenUsageComputer.increment(total.tokenUsage, event.tokenUsage);
  };

  export const filterPhase = <Phase extends AutoBePhase>(
    collection: AutoBeProcessAggregateCollection,
    phase: Phase,
  ): AutoBeProcessAggregateCollection<Phase> => {
    const result: AutoBeProcessAggregateCollection<Phase> = createCollection();
    for (const [key, value] of Object.entries(collection)) {
      if (key === "total") continue;
      else if (key.startsWith(phase) === false) continue;

      (result as any)[key] = value;
      AutoBeFunctionCallingMetricFactory.increment(
        result.total.metric,
        value.metric,
      );
      TokenUsageComputer.increment(result.total.tokenUsage, value.tokenUsage);
    }
    return result;
  };

  export const reduce = (
    collections: AutoBeProcessAggregateCollection[],
  ): AutoBeProcessAggregateCollection => {
    const result: AutoBeProcessAggregateCollection = createCollection();
    for (const collection of collections) {
      for (const [key, value] of Object.entries(collection)) {
        if (key === "total") continue;
        (result as any)[key] ??= createAggregate();
        const local: AutoBeProcessAggregate = (result as any)[
          key
        ] as AutoBeProcessAggregate;
        AutoBeFunctionCallingMetricFactory.increment(
          local.metric,
          value.metric,
        );
        TokenUsageComputer.increment(local.tokenUsage, value.tokenUsage);
        AutoBeFunctionCallingMetricFactory.increment(
          result.total.metric,
          value.metric,
        );
        TokenUsageComputer.increment(result.total.tokenUsage, value.tokenUsage);
      }
    }
    result.total ??= createAggregate();
    Object.assign(result.total, computeTotal(result));
    return result;
  };

  export const increment = (
    x: AutoBeProcessAggregateCollection,
    y: AutoBeProcessAggregateCollection,
  ): void => {
    for (const [key, value] of Object.entries(y)) {
      if (key === "total") continue;
      (x as any)[key] ??= createAggregate();
      const local: AutoBeProcessAggregate = (x as any)[
        key
      ] as AutoBeProcessAggregate;
      AutoBeFunctionCallingMetricFactory.increment(local.metric, value.metric);
    }
    x.total ??= createAggregate();
    Object.assign(x.total, computeTotal(x));
  };

  export const minus = (
    x: AutoBeProcessAggregateCollection,
    y: AutoBeProcessAggregateCollection,
  ): AutoBeProcessAggregateCollection => {
    const result = JSON.parse(
      JSON.stringify(x),
    ) as AutoBeProcessAggregateCollection;
    for (const [key, value] of Object.entries(y)) {
      if (key === "total") continue;
      (result as any)[key] ??= createAggregate();
      const local: AutoBeProcessAggregate = (result as any)[
        key
      ] as AutoBeProcessAggregate;
      AutoBeFunctionCallingMetricFactory.minus(local.metric, value.metric);
    }
    result.total ??= createAggregate();
    Object.assign(result.total, computeTotal(result));
    return result;
  };
}
