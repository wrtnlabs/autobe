import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";
import { convertToSectionEntries } from "./convertToSectionEntries";

export function createPreliminaryCollection(
  state: AutoBeState | null,
  defined?: Partial<IAutoBePreliminaryCollection>,
): IAutoBePreliminaryCollection {
  if (state === null)
    return {
      analysisSections: (defined?.analysisSections ?? []).slice(),
      databaseSchemas: (defined?.databaseSchemas ?? []).slice(),
      interfaceOperations: (defined?.interfaceOperations ?? []).slice(),
      interfaceSchemas: Object.fromEntries(
        Object.entries(defined?.interfaceSchemas ?? {}),
      ),
      realizeCollectors: (defined?.realizeCollectors ?? []).slice(),
      realizeTransformers: (defined?.realizeTransformers ?? []).slice(),
      previousAnalysisSections: (
        defined?.previousAnalysisSections ?? []
      ).slice(),
      previousDatabaseSchemas: (defined?.previousDatabaseSchemas ?? []).slice(),
      previousInterfaceSchemas: Object.fromEntries(
        Object.entries(defined?.previousInterfaceSchemas ?? {}),
      ),
      previousInterfaceOperations: (
        defined?.previousInterfaceOperations ?? []
      ).slice(),
      complete: null,
    };
  return {
    analysisSections: (
      defined?.analysisSections ??
      convertToSectionEntries(state.analyze?.files ?? [])
    ).slice(),
    databaseSchemas: (
      defined?.databaseSchemas ??
      state.database?.result.data.files.map((f) => f.models).flat() ??
      []
    ).slice(),
    interfaceOperations: (
      defined?.interfaceOperations ??
      state.interface?.document.operations ??
      []
    ).slice(),
    interfaceSchemas: Object.fromEntries(
      Object.entries(
        defined?.interfaceSchemas ??
          state.interface?.document.components.schemas ??
          {},
      ),
    ),
    realizeCollectors: (
      defined?.realizeCollectors ??
      state.realize?.functions.filter((f) => f.type === "collector") ??
      []
    ).slice(),
    realizeTransformers: (
      defined?.realizeTransformers ??
      state.realize?.functions.filter((f) => f.type === "transformer") ??
      []
    ).slice(),
    previousAnalysisSections: convertToSectionEntries(
      state.previousAnalyze?.files ?? [],
    ),
    previousDatabaseSchemas:
      state.previousDatabase?.result.data.files.map((f) => f.models).flat() ??
      [],
    previousInterfaceSchemas: Object.fromEntries(
      Object.entries(
        state.previousInterface?.document.components.schemas ?? {},
      ),
    ),
    previousInterfaceOperations:
      state.previousInterface?.document.operations.slice() ?? [],
    complete: null,
  };
}
