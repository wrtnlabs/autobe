import {
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
    groups: AutoBeInterfaceGroup[];
    authorizations: AutoBeOpenApi.IOperation[];
    baseEndpoints: AutoBeOpenApi.IEndpoint[];
    progress: AutoBeProgressEventBase;
    reviewProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> =>
  orchestrateInterfaceEndpointOverall(ctx, {
    programmer: {
      kind: "action",
      history: (next) =>
        transformInterfaceActionEndpointWriteHistory({
          state: ctx.state(),
          authorizations: props.authorizations,
          baseEndpoints: props.baseEndpoints,
          instruction: props.instruction,
          group: next.group,
          preliminary: next.preliminary,
        }),
      review: (next) =>
        orchestrateInterfaceEndpointReview(ctx, {
          programmer: {
            kind: "action",
            history: (future) =>
              transformInterfaceActionEndpointReviewHistory({
                baseEndpoints: props.baseEndpoints,
                authorizations: props.authorizations,
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
