import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export function createPreliminaryCollection(
  state: AutoBeState | null,
  defined?: Partial<IAutoBePreliminaryCollection>,
): IAutoBePreliminaryCollection {
  if (state === null)
    return {
      analysisFiles: (defined?.analysisFiles ?? []).slice(),
      databaseSchemas: (defined?.databaseSchemas ?? []).slice(),
      interfaceOperations: (defined?.interfaceOperations ?? []).slice(),
      interfaceSchemas: Object.fromEntries(
        Object.entries(defined?.interfaceSchemas ?? {}),
      ),
      realizeCollectors: (defined?.realizeCollectors ?? []).slice(),
      realizeTransformers: (defined?.realizeTransformers ?? []).slice(),
      previousAnalysisFiles: (defined?.previousAnalysisFiles ?? []).slice(),
      previousDatabaseSchemas: (defined?.previousDatabaseSchemas ?? []).slice(),
      previousInterfaceSchemas: Object.fromEntries(
        Object.entries(defined?.previousInterfaceSchemas ?? {}),
      ),
      previousInterfaceOperations: (
        defined?.previousInterfaceOperations ?? []
      ).slice(),
    };
  return {
    analysisFiles: defined?.analysisFiles ?? state.analyze?.files ?? [],
    databaseSchemas:
      defined?.databaseSchemas ??
      state.database?.result.data.files.map((f) => f.models).flat() ??
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
    previousAnalysisFiles: state.previousAnalyze?.files ?? [],
    previousDatabaseSchemas:
      state.previousDatabase?.result.data.files.map((f) => f.models).flat() ??
      [],
    previousInterfaceSchemas:
      state.previousInterface?.document.components.schemas ?? {},
    previousInterfaceOperations:
      state.previousInterface?.document.operations ?? [],
  };
}
