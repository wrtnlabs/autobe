import { IAutoBeInterfaceSchemaApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaApplication";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";

export const test_schema_interface_plugin = async () => {
  const app: ILlmApplication =
    typia.llm.application<IAutoBeInterfaceSchemaApplication>();
  const $defs: Record<string, ILlmSchema> = app.functions[0].parameters.$defs;
  console.log(
    Object.keys($defs),
    Object.keys($defs).includes("AutoBeOpenApi.IJsonSchema.IObject"),
    Object.keys($defs).includes("AutoBeOpenApi.IJsonSchemaDescriptive.IObject"),
  );
};
