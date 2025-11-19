import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export function createPreliminaryCollection(
  state: AutoBeState | null,
  defined?: Partial<IAutoBePreliminaryCollection>,
): IAutoBePreliminaryCollection {
  if (state === null)
    return {
      analysisFiles: (defined?.analysisFiles ?? []).slice(),
      prismaSchemas: (defined?.prismaSchemas ?? []).slice(),
      interfaceOperations: (defined?.interfaceOperations ?? []).slice(),
      interfaceSchemas: Object.fromEntries(
        Object.entries(defined?.interfaceSchemas ?? {}),
      ),
    };
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
  };
}
