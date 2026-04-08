import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceActionEndpointWriteHistory } from "./histories/transformInterfaceActionEndpointWriteHistory";
import { orchestrateInterfaceEndpointOverall } from "./orchestrateInterfaceEndpointOverall";

export const orchestrateInterfaceActionEndpoint = (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    authorizeOperations: AutoBeOpenApi.IOperation[];
    groups: AutoBeInterfaceGroup[];
    baseEndpoints: AutoBeInterfaceEndpointDesign[];
    progress: AutoBeProgressEventBase;
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
    },
    groups: props.groups,
    progress: props.progress,
  });
