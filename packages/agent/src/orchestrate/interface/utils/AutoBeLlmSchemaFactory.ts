import { StringUtil } from "@autobe/utils";
import { ILlmSchema, LlmTypeChecker } from "@samchon/openapi";

import { AutoBeState } from "../../../context/AutoBeState";

export namespace AutoBeLlmSchemaFactory {
  export const fixDatabasePlugin = (
    state: AutoBeState,
    $defs: Record<string, ILlmSchema>,
  ): void => {
    if (state.database === null) return;
    const models: string[] = state.database.result.data.files
      .map((f) => f.models.map((m) => m.name))
      .flat()
      .sort();
    for (const value of Object.values($defs)) {
      LlmTypeChecker.visit({
        $defs,
        schema: value,
        closure: (next) => {
          if (LlmTypeChecker.isObject(next) === false) return;

          const property: ILlmSchema | undefined =
            next.properties["x-autobe-database-schema"];
          if (property && LlmTypeChecker.isAnyOf(property)) {
            property.description ??= "";
            property.description += "\n\n";
            property.description += StringUtil.trim`
              Here is the list of database schemas available for association:

              ${models.map((m) => `- \`${m}\``).join("\n")}
            `;
          }
        },
      });
    }
  };
}
