import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceGroup,
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
    groups: AutoBeInterfaceGroup[];
    progress: AutoBeProgressEventBase;
    reviewProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeInterfaceEndpointDesign[]> =>
  orchestrateInterfaceEndpointOverall(ctx, {
    programmer: {
      kind: "base",
      history: (next) =>
        transformInterfaceBaseEndpointWriteHistory({
          state: ctx.state(),
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
