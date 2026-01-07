import { ILlmSchema, LlmTypeChecker } from "@samchon/openapi";

import { AutoBeState } from "../../../context/AutoBeState";

export namespace LlmSchemaFactory {
  export const fixDatabasePlugin = (
    state: AutoBeState,
    $defs: Record<string, ILlmSchema>,
  ): void => {
    if (state.database === null) return;
    const models: string[] = state.database.result.data.files
      .map((f) => f.models.map((m) => m.name))
      .flat()
      .sort();
    const fix = (obj: ILlmSchema | undefined) => {
      if (obj === undefined || LlmTypeChecker.isObject(obj) === false) return;

      const property = obj.properties["x-autobe-database-schema"];
      if (property === undefined || LlmTypeChecker.isAnyOf(property) === false)
        return;

      const str: ILlmSchema.IString | undefined = property.anyOf.filter((s) =>
        LlmTypeChecker.isString(s),
      )[0];
      if (str === undefined) return;
      str.enum = models;
    };
    fix($defs["AutoBeOpenApi.IJsonSchema.IObject"]);
    fix($defs["AutoBeOpenApi.IJsonSchemaDescriptive.IObject"]);
  };
}
