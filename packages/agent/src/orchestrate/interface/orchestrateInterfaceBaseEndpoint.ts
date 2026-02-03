import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceBaseEndpointReviewHistory } from "./histories/transformInterfaceBaseEndpointReviewHistory";
import { transformInterfaceBaseEndpointWriteHistory } from "./histories/transformInterfaceBaseEndpointWriteHistory";
import { orchestrateInterfaceEndpointOverall } from "./orchestrateInterfaceEndpointOverall";
import { orchestrateInterfaceEndpointReview } from "./orchestrateInterfaceEndpointReview";

export const orchestrateInterfaceBaseEndpoint = (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    authorizeOperations: AutoBeOpenApi.IOperation[];
    groups: AutoBeInterfaceGroup[];
    reviewProgress: AutoBeProgressEventBase;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeInterfaceEndpointDesign[]> =>
  orchestrateInterfaceEndpointOverall(ctx, {
    programmer: {
      kind: "base",
      history: (next) =>
        transformInterfaceBaseEndpointWriteHistory({
          state: ctx.state(),
          authorizeOperations: props.authorizeOperations,
          group: next.group,
          instruction: props.instruction,
          preliminary: next.preliminary,
        }),
      review: (next) =>
        orchestrateInterfaceEndpointReview(ctx, {
          programmer: {
            kind: "base",
            history: (future) =>
              transformInterfaceBaseEndpointReviewHistory({
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
