import {
  AutoBeAggregateEventBase,
  AutoBePhase,
  AutoBeProcessAggregate,
  AutoBeProcessAggregateCollection,
} from "@autobe/interface";

import { AutoBeTokenUsageComponent } from "../context/AutoBeTokenUsageComponent";
import { TokenUsageComputer } from "../utils/TokenUsageComputer";
import { AutoBeFunctionCallingMetricFactory } from "./AutoBeFunctionCallingMetricFactory";

export namespace AutoBeProcessAggregateFactory {
  export const createAggregate = (): AutoBeProcessAggregate => ({
    metric: AutoBeFunctionCallingMetricFactory.create(),
    tokenUsage: new AutoBeTokenUsageComponent().toJSON(),
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
    result.total = computeTotal(result);
    return result;
  };
}
