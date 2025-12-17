import { AutoBeOpenApi, AutoBeTestPrepareFunction } from "@autobe/interface";

export interface IAutoBeTestPrepareProcedure {
  type: "prepare";
  typeName: string;
  schema: AutoBeOpenApi.IJsonSchema.IObject;
  function: AutoBeTestPrepareFunction;
}
