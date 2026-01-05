import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { IAutoBeInterfaceSchemaApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaApplication";
import { JsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/JsonSchemaFactory";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";
import { ILlmApplication, ILlmSchema, LlmTypeChecker } from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_schema_interface_plugin = async () => {
  if (
    (await AutoBeExampleStorage.has({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "interface",
    })) === false
  )
    return false;

  const agent: AutoBeAgent = new AutoBeAgent({
    vendor: {
      api: new OpenAI({ apiKey: "" }),
      model: TestGlobal.vendorModel,
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories: await AutoBeExampleStorage.getHistories({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "interface",
    }),
  });
  const state: AutoBeState = agent.getContext().state();

  const app: ILlmApplication =
    typia.llm.application<IAutoBeInterfaceSchemaApplication>();
  const $defs: Record<string, ILlmSchema> = app.functions[0].parameters.$defs;
  JsonSchemaFactory.fixPlugin(state, $defs);

  const models: string[] =
    state.database?.result.data.files
      .map((f) => f.models.map((m) => m.name))
      .flat()
      .sort() ?? [];
  TestValidator.equals(
    "plugin",
    models,
    ($defs as any)["AutoBeOpenApi.IJsonSchemaDescriptive.IObject"].properties[
      "x-autobe-database-schema"
    ].anyOf.find((s: ILlmSchema) => LlmTypeChecker.isString(s))?.enum ?? [],
  );
};
