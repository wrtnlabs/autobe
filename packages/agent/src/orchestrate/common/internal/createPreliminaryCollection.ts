import { AutoBeHistory } from "@autobe/interface";

import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export function createPreliminaryCollection(
  ctx: null | {
    histories: readonly AutoBeHistory[];
    state: AutoBeState;
  },
  defined?: Partial<IAutoBePreliminaryCollection>,
): IAutoBePreliminaryCollection {
  if (ctx === null)
    return {
      analysisFiles: (defined?.analysisFiles ?? []).slice(),
      prismaSchemas: (defined?.prismaSchemas ?? []).slice(),
      interfaceOperations: (defined?.interfaceOperations ?? []).slice(),
      interfaceSchemas: Object.fromEntries(
        Object.entries(defined?.interfaceSchemas ?? {}),
      ),
      realizeCollectors: (defined?.realizeCollectors ?? []).slice(),
      realizeTransformers: (defined?.realizeTransformers ?? []).slice(),
      previousAnalysisFiles: (defined?.previousAnalysisFiles ?? []).slice(),
      previousPrismaSchemas: (defined?.previousPrismaSchemas ?? []).slice(),
      previousInterfaceSchemas: Object.fromEntries(
        Object.entries(defined?.previousInterfaceSchemas ?? {}),
      ),
      previousInterfaceOperations: (
        defined?.previousInterfaceOperations ?? []
      ).slice(),
    };

  const histories: AutoBeHistory[] = ctx.histories.slice().reverse();
  const state: AutoBeState = ctx.state;
  const previous = <Type extends "analyze" | "prisma" | "interface">(
    type: Type,
  ): AutoBeHistory.Mapper[Type] | undefined =>
    histories.find((h): h is AutoBeHistory.Mapper[Type] => h.type === type);
  return {
    analysisFiles: defined?.analysisFiles ?? state.analyze?.files ?? [],
    prismaSchemas:
      defined?.prismaSchemas ??
      state.prisma?.result.data.files.map((f) => f.models).flat() ??
      [],
    interfaceOperations:
      defined?.interfaceOperations ??
      state.interface?.document.operations ??
      [],
    interfaceSchemas:
      defined?.interfaceSchemas ??
      state.interface?.document.components.schemas ??
      {},
    realizeCollectors:
      defined?.realizeCollectors ??
      state.realize?.functions.filter((f) => f.type === "collector") ??
      [],
    realizeTransformers:
      defined?.realizeTransformers ??
      state.realize?.functions.filter((f) => f.type === "transformer") ??
      [],
    previousAnalysisFiles: previous("analyze")?.files ?? [],
    previousPrismaSchemas:
      previous("prisma")
        ?.result.data.files.map((f) => f.models)
        .flat() ?? [],
    previousInterfaceSchemas:
      previous("interface")?.document.components.schemas ?? {},
    previousInterfaceOperations:
      previous("interface")?.document.operations ?? [],
  };
}
