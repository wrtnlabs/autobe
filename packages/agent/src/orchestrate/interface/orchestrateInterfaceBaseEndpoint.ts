import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceBaseEndpointWriteHistory } from "./histories/transformInterfaceBaseEndpointWriteHistory";
import { orchestrateInterfaceEndpointOverall } from "./orchestrateInterfaceEndpointOverall";

export const orchestrateInterfaceBaseEndpoint = (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    authorizeOperations: AutoBeOpenApi.IOperation[];
    groups: AutoBeInterfaceGroup[];
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
    },
    groups: props.groups,
    progress: props.progress,
  });
