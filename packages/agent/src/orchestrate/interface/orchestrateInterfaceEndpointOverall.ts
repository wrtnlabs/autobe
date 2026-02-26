import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceGroup,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, Pair } from "tstl";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../structures/IAutoBeOrchestrateHistory";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { orchestrateInterfaceEndpointWrite } from "./orchestrateInterfaceEndpointWrite";
import { AutoBeInterfaceEndpointProgrammer } from "./programmers/AutoBeInterfaceEndpointProgrammer";

interface IProgrammer {
  kind: AutoBeInterfaceEndpointEvent["kind"];
  history(next: {
    group: AutoBeInterfaceGroup;
    preliminary: AutoBePreliminaryController<
      | "analysisSections"
      | "databaseSchemas"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
      | "previousInterfaceOperations"
    >;
  }): IAutoBeOrchestrateHistory;
  review(next: {
    group: AutoBeInterfaceGroup;
    designs: AutoBeInterfaceEndpointDesign[];
    promptCacheKey: string;
  }): Promise<AutoBeInterfaceEndpointDesign[]>;
}

export const orchestrateInterfaceEndpointOverall = async (
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer;
    groups: AutoBeInterfaceGroup[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeInterfaceEndpointDesign[]> => {
  const matrix: AutoBeInterfaceEndpointDesign[][] = await executeCachedBatch(
    ctx,
    props.groups.map((group) => async (promptCacheKey) => {
      let designs: AutoBeInterfaceEndpointDesign[] = await forceRetry(() =>
        orchestrateInterfaceEndpointWrite(ctx, {
          ...props,
          group,
          promptCacheKey,
        }),
      );
      for (let i: number = 0; i < 2; ++i)
        try {
          designs = await props.programmer.review({
            group,
            designs,
            promptCacheKey: promptCacheKey + "_review",
          });
        } catch {}
      return designs;
    }),
  );
  return new HashMap(
    matrix.flat().map((design) => new Pair(design.endpoint, design)),
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  )
    .toJSON()
    .map((it) => it.second)
    .filter((design) =>
      AutoBeInterfaceEndpointProgrammer.filter({
        design,
        kind: props.programmer.kind,
        actors: ctx.state().analyze?.actors ?? [],
      }),
    );
};
