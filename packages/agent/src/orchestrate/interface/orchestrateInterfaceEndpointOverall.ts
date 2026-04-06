import {
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointEvent,
  AutoBeInterfaceGroup,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap, Pair, Singleton } from "tstl";

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
      | "complete"
    >;
  }): IAutoBeOrchestrateHistory;
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
      const counter = new Singleton(() => ++props.progress.completed);
      let designs: AutoBeInterfaceEndpointDesign[];
      try {
        designs = await forceRetry(() =>
          orchestrateInterfaceEndpointWrite(ctx, {
            ...props,
            counter,
            group,
            promptCacheKey,
          }),
        );
      } catch (error) {
        counter.get();
        throw error;
      }
      // review removed — write agents self-review during rewrite loop
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
