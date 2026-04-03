import { AutoBeRealizeCollectorFunction } from "@autobe/interface";

export function createMockCollector(props: {
  dtoTypeName: string;
  databaseSchemaName: string;
}): AutoBeRealizeCollectorFunction {
  return {
    type: "collector",
    plan: {
      type: "collector",
      dtoTypeName: props.dtoTypeName,
      thinking: "mock collector",
      databaseSchemaName: props.databaseSchemaName,
      references: [],
    },
    neighbors: [],
    location: "src/collectors/MockCollector.ts",
    content: "// mock",
  };
}
