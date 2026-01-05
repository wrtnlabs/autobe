import { AutoBeAgent } from "@autobe/agent";
import { AutoBePreliminaryController } from "@autobe/agent/src/orchestrate/common/AutoBePreliminaryController";
import { IAutoBeInterfaceSchemaReviewApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaReviewApplication";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";
import { ILlmApplication, ILlmSchema, LlmTypeChecker } from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_schema_preliminary_erase = async () => {
  if (
    (await AutoBeExampleStorage.has({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "database",
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
      phase: "database",
    }),
  });

  const application: ILlmApplication =
    typia.llm.application<IAutoBeInterfaceSchemaReviewApplication>();
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaReviewApplication>(),
    source: "interfaceSchemaReview",
    kinds: [
      "analysisFiles",
      "databaseSchemas",
      "interfaceOperations",
      "interfaceSchemas",
      "previousAnalysisFiles",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: agent.getContext().state(),
  });
  preliminary.fixApplication(application);

  const request: ILlmSchema.IAnyOf = application.functions[0].parameters
    .properties.request as ILlmSchema.IAnyOf;
  TestValidator.equals(
    "typeNames",
    request.anyOf
      .filter(LlmTypeChecker.isReference)
      .map((r) => r.$ref.split("/").pop()!)
      .sort(),
    [
      "IAutoBeInterfaceSchemaReviewApplication.IComplete",
      "IAutoBePreliminaryGetAnalysisFiles",
      "IAutoBePreliminaryGetDatabaseSchemas",
      "IAutoBePreliminaryGetInterfaceOperations",
      "IAutoBePreliminaryGetInterfaceSchemas",
    ].sort(),
  );
  TestValidator.equals(
    "mapping",
    Object.keys(request["x-discriminator"]?.mapping ?? {}).sort(),
    [
      "complete",
      "getAnalysisFiles",
      "getDatabaseSchemas",
      "getInterfaceOperations",
      "getInterfaceSchemas",
    ].sort(),
  );
  TestValidator.equals(
    "kinds",
    preliminary.getKinds().slice().sort(),
    [
      "analysisFiles",
      "databaseSchemas",
      "interfaceOperations",
      "interfaceSchemas",
    ].sort() as Array<
      | "analysisFiles"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
    >,
  );
};
