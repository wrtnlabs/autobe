import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";

import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export function createPreliminaryCollection(
  state: AutoBeState | null,
  defined?: Partial<IAutoBePreliminaryCollection>,
): IAutoBePreliminaryCollection {
  if (state === null)
    return {
      // LATEST
      analysisFiles: (defined?.analysisFiles ?? [])
        .slice()
        .sort((a, b) => a.filename.localeCompare(b.filename)),
      databaseSchemas: (defined?.databaseSchemas ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
      interfaceOperations: (defined?.interfaceOperations ?? [])
        .slice()
        .sort(AutoBeOpenApiEndpointComparator.compare),
      interfaceSchemas: Object.fromEntries(
        Object.entries(defined?.interfaceSchemas ?? {}).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      ),
      realizeCollectors: (defined?.realizeCollectors ?? [])
        .slice()
        .sort((a, b) =>
          a.plan.dtoTypeName === b.plan.dtoTypeName
            ? a.plan.databaseSchemaName.localeCompare(b.plan.databaseSchemaName)
            : a.plan.dtoTypeName.localeCompare(b.plan.dtoTypeName),
        ),
      realizeTransformers: (defined?.realizeTransformers ?? [])
        .slice()
        .sort((a, b) =>
          a.plan.dtoTypeName === b.plan.dtoTypeName
            ? a.plan.databaseSchemaName.localeCompare(b.plan.databaseSchemaName)
            : a.plan.dtoTypeName.localeCompare(b.plan.dtoTypeName),
        ),
      // PREVIOUS
      previousAnalysisFiles: (defined?.previousAnalysisFiles ?? [])
        .slice()
        .sort((a, b) => a.filename.localeCompare(b.filename)),
      previousDatabaseSchemas: (defined?.previousDatabaseSchemas ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
      previousInterfaceSchemas: Object.fromEntries(
        Object.entries(defined?.previousInterfaceSchemas ?? {}).sort(
          ([a], [b]) => a.localeCompare(b),
        ),
      ),
      previousInterfaceOperations: (defined?.previousInterfaceOperations ?? [])
        .slice()
        .sort(AutoBeOpenApiEndpointComparator.compare),
    };
  return {
    // LATEST
    analysisFiles: (defined?.analysisFiles ?? state.analyze?.files ?? [])
      .slice()
      .sort((a, b) => a.filename.localeCompare(b.filename)),
    databaseSchemas: (
      defined?.databaseSchemas ??
      state.database?.result.data.files.map((f) => f.models).flat() ??
      []
    )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
    interfaceOperations: (
      defined?.interfaceOperations ??
      state.interface?.document.operations ??
      []
    )
      .slice()
      .sort(AutoBeOpenApiEndpointComparator.compare),
    interfaceSchemas: Object.fromEntries(
      Object.entries(
        defined?.interfaceSchemas ??
          state.interface?.document.components.schemas ??
          {},
      ).sort(([a], [b]) => a.localeCompare(b)),
    ),
    realizeCollectors: (
      defined?.realizeCollectors ??
      state.realize?.functions.filter((f) => f.type === "collector") ??
      []
    )
      .slice()
      .sort((a, b) =>
        a.plan.dtoTypeName === b.plan.dtoTypeName
          ? a.plan.databaseSchemaName.localeCompare(b.plan.databaseSchemaName)
          : a.plan.dtoTypeName.localeCompare(b.plan.dtoTypeName),
      ),
    realizeTransformers: (
      defined?.realizeTransformers ??
      state.realize?.functions.filter((f) => f.type === "transformer") ??
      []
    )
      .slice()
      .sort((a, b) =>
        a.plan.dtoTypeName === b.plan.dtoTypeName
          ? a.plan.databaseSchemaName.localeCompare(b.plan.databaseSchemaName)
          : a.plan.dtoTypeName.localeCompare(b.plan.dtoTypeName),
      ),
    // PREVIOUS
    previousAnalysisFiles: (state.previousAnalyze?.files ?? [])
      .slice()
      .sort((a, b) => a.filename.localeCompare(b.filename)),
    previousDatabaseSchemas: (
      state.previousDatabase?.result.data.files.map((f) => f.models).flat() ??
      []
    )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
    previousInterfaceSchemas: Object.fromEntries(
      Object.entries(
        state.previousInterface?.document.components.schemas ?? {},
      ).sort(([a], [b]) => a.localeCompare(b)),
    ),
    previousInterfaceOperations: (
      state.previousInterface?.document.operations ?? []
    )
      .slice()
      .sort(AutoBeOpenApiEndpointComparator.compare),
  };
}
