import { AutoBeRealizeTransformerFunction } from "@autobe/interface";

export function createMockTransformer(props: {
  dtoTypeName: string;
  databaseSchemaName: string;
}): AutoBeRealizeTransformerFunction {
  return {
    type: "transformer",
    plan: {
      type: "transformer",
      dtoTypeName: props.dtoTypeName,
      thinking: "mock transformer",
      databaseSchemaName: props.databaseSchemaName,
    },
    neighbors: [],
    location: "src/transformers/MockTransformer.ts",
    content: "// mock",
    template: "",
  };
}
