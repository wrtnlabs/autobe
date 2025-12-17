import {
  AutoBeOpenApi,
  AutoBeTestPrepareWriteFunction,
} from "@autobe/interface";

export interface IAutoBeTestPrepareWriteResult {
  type: "prepare";
  typeName: string;
  schema: AutoBeOpenApi.IJsonSchema.IObject;
  function: AutoBeTestPrepareWriteFunction;
}
