import { AutoBeAgent } from "@autobe/agent";
import { AutoBePreliminaryController } from "@autobe/agent/src/orchestrate/common/AutoBePreliminaryController";
import { IAutoBeInterfaceSchemaReviewApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaReviewApplication";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";
import { LlmTypeChecker } from "@typia/utils";
import OpenAI from "openai";
import typia, { ILlmApplication, ILlmSchema } from "typia";

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
    | "analysisSections"
    | "databaseSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaReviewApplication>(),
    source: "interfaceSchemaReview",
    kinds: [
      "analysisSections",
      "databaseSchemas",
      "interfaceOperations",
      "interfaceSchemas",
      "previousAnalysisSections",
      "previousDatabaseSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: agent.getContext().state(),
  });
  preliminary.fixApplication(application, true);

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
      "IAutoBePreliminaryGetAnalysisSections",
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
      "getAnalysisSections",
      "getDatabaseSchemas",
      "getInterfaceOperations",
      "getInterfaceSchemas",
    ].sort(),
  );
  TestValidator.equals(
    "kinds",
    preliminary.getKinds().slice().sort(),
    [
      "analysisSections",
      "databaseSchemas",
      "interfaceOperations",
      "interfaceSchemas",
    ].sort() as Array<
      | "analysisSections"
      | "databaseSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
    >,
  );
};
