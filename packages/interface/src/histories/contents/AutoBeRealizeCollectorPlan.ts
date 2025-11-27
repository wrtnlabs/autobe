export interface AutoBeRealizeCollectorPlan {
  kind: "collector";
  dtoTypeName: string;
  thinking: string;
  prismaSchemaName: string;
  references: string[];
}
