import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export function createPreliminaryCollection(
  state: AutoBeState | null,
  defined?: Partial<IAutoBePreliminaryCollection>,
): IAutoBePreliminaryCollection {
  if (state === null)
    return {
      analyzeFiles: defined?.analyzeFiles ?? [],
      prismaSchemas: defined?.prismaSchemas ?? [],
      interfaceOperations: defined?.interfaceOperations ?? [],
      interfaceSchemas: defined?.interfaceSchemas ?? {},
    };
  return {
    analyzeFiles: defined?.analyzeFiles ?? state.analyze?.files ?? [],
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
