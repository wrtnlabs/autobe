import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, Pair } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateInterfaceActionEndpoint } from "./orchestrateInterfaceActionEndpoint";
import { orchestrateInterfaceBaseEndpoint } from "./orchestrateInterfaceBaseEndpoint";

export const orchestrateInterfaceEndpoint = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    authorizeOperations: AutoBeOpenApi.IOperation[];
    groups: AutoBeInterfaceGroup[];
  },
): Promise<AutoBeInterfaceEndpointDesign[]> => {
  const writeProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: props.groups.length * ENDPOINT_STEPS,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: props.groups.length * ENDPOINT_STEPS,
  };

  // BASE ENDPOINTS
  const baseEndpoints: AutoBeInterfaceEndpointDesign[] =
    await orchestrateInterfaceBaseEndpoint(ctx, {
      instruction: props.instruction,
      authorizeOperations: props.authorizeOperations,
      groups: props.groups,
      reviewProgress: reviewProgress,
      progress: writeProgress,
    });

  // ACTION ENDPOINTS
  const actionEndpoints: AutoBeInterfaceEndpointDesign[] =
    await orchestrateInterfaceActionEndpoint(ctx, {
      instruction: props.instruction,
      authorizeOperations: props.authorizeOperations,
      groups: props.groups,
      baseEndpoints: baseEndpoints,
      progress: writeProgress,
      reviewProgress: reviewProgress,
    });

  // UNIQUE FILTERING
  return new HashMap(
    [...baseEndpoints, ...actionEndpoints].map(
      (design) => new Pair(design.endpoint, design),
    ),
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  )
    .toJSON()
    .map((it) => it.second);
};

const ENDPOINT_STEPS =
  typia.misc.literals<AutoBeInterfaceEndpointEvent["kind"]>().length;
