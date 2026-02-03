import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceActionEndpointReviewHistory } from "./histories/transformInterfaceActionEndpointReviewHistory";
import { transformInterfaceActionEndpointWriteHistory } from "./histories/transformInterfaceActionEndpointWriteHistory";
import { orchestrateInterfaceEndpointOverall } from "./orchestrateInterfaceEndpointOverall";
import { orchestrateInterfaceEndpointReview } from "./orchestrateInterfaceEndpointReview";

export const orchestrateInterfaceActionEndpoint = (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    authorizeOperations: AutoBeOpenApi.IOperation[];
    groups: AutoBeInterfaceGroup[];
    baseEndpoints: AutoBeInterfaceEndpointDesign[];
    progress: AutoBeProgressEventBase;
    reviewProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeInterfaceEndpointDesign[]> =>
  orchestrateInterfaceEndpointOverall(ctx, {
    programmer: {
      kind: "action",
      history: (next) =>
        transformInterfaceActionEndpointWriteHistory({
          state: ctx.state(),
          instruction: props.instruction,
          authorizeOperations: props.authorizeOperations,
          group: next.group,
          baseEndpoints: props.baseEndpoints.map((e) => e.endpoint),
          preliminary: next.preliminary,
        }),
      review: (next) =>
        orchestrateInterfaceEndpointReview(ctx, {
          programmer: {
            kind: "action",
            history: (future) =>
              transformInterfaceActionEndpointReviewHistory({
                baseEndpoints: props.baseEndpoints.map((e) => e.endpoint),
                preliminary: future.preliminary,
                designs: future.designs,
                group: future.group,
                authorizeOperations: props.authorizeOperations,
              }),
          },
          group: next.group,
          designs: next.designs,
          promptCacheKey: next.promptCacheKey,
          progress: props.reviewProgress,
        }),
    },
    groups: props.groups,
    progress: props.progress,
  });
