import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceEndpointRevise,
  AutoBeInterfaceGroup,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, HashSet, Pair } from "tstl";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestrateInterfaceEndpointWrite } from "./orchestrateInterfaceEndpointWrite";

interface IProgrammer {
  kind: AutoBeInterfaceEndpointEvent["kind"];
  history(next: {
    group: AutoBeInterfaceGroup;
    preliminary: AutoBePreliminaryController<
      | "analysisFiles"
      | "databaseSchemas"
      | "previousAnalysisFiles"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
  }): IAutoBeOrchestrateHistory;
  review(next: {
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
    promptCacheKey: string;
  }): Promise<AutoBeInterfaceEndpointRevise[]>;
}

export const orchestrateInterfaceEndpointOverall = async (
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer;
    groups: AutoBeInterfaceGroup[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeOpenApi.IEndpoint[]> => {
  const matrix: AutoBeOpenApi.IEndpoint[][] = await executeCachedBatch(
    ctx,
    props.groups.map((group) => async (promptCacheKey) => {
      const designs: AutoBeInterfaceEndpointDesign[] =
        await orchestrateInterfaceEndpointWrite(ctx, {
          ...props,
          group,
          promptCacheKey,
        });
      const dict: HashMap<
        AutoBeOpenApi.IEndpoint,
        AutoBeInterfaceEndpointDesign
      > = new HashMap(
        designs.map((c) => new Pair(c.endpoint, c)),
        (e) => AutoBeOpenApiEndpointComparator.hashCode(e),
        (a, b) => AutoBeOpenApiEndpointComparator.equals(a, b),
      );
      for (const revise of await props.programmer.review({
        group,
        designs,
        promptCacheKey: promptCacheKey + "_review",
      })) {
        if (revise.type === "create")
          dict.set(revise.endpoint, {
            endpoint: revise.endpoint,
            description: revise.description,
          });
        else if (revise.type === "update") {
          dict.erase(revise.original);
          dict.set(revise.updated, {
            endpoint: revise.updated,
            description: revise.description,
          });
        } else if (revise.type === "erase") dict.erase(revise.endpoint);
        else revise satisfies never;
      }
      return dict.toJSON().map((it) => it.first);
    }),
  );
  return new HashSet(
    matrix.flat(),
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  ).toJSON();
};
