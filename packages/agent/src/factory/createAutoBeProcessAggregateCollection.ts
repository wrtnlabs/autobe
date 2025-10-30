import { AutoBePhase } from "@autobe/interface";
import { AutoBeProcessAggregate } from "@autobe/interface/src/histories/contents/AutoBeProcessAggregate";
import { AutoBeProcessAggregateCollection } from "@autobe/interface/src/histories/contents/AutoBeProcessAggregateCollection";

import { AutoBeTokenUsageComponent } from "../context/AutoBeTokenUsageComponent";

export const createAutoBeProcessAggregateCollection = <
  Phase extends AutoBePhase,
>(
  _phase: Phase,
): AutoBeProcessAggregateCollection<Phase> => {
  const total: AutoBeProcessAggregate = {
    tokenUsage: new AutoBeTokenUsageComponent().toJSON(),
    metric: {
      total: 0,
      success: 0,
      consent: 0,
      validationFailure: 0,
      invalidJson: 0,
    },
  };
  return {
    total,
  } as AutoBeProcessAggregateCollection<Phase>;
};
