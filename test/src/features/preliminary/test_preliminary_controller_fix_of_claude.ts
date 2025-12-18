import { AutoBeAgent } from "@autobe/agent";
import { AutoBePreliminaryController } from "@autobe/agent/src/orchestrate/common/AutoBePreliminaryController";
import { IAutoBeInterfaceSchemaReviewApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaReviewApplication";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";
import {
  ClaudeTypeChecker,
  IClaudeSchema,
  ILlmApplication,
} from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_preliminary_controller_fix_of_chatgpt = async () => {
  if (
    (await AutoBeExampleStorage.has({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "prisma",
    })) === false
  )
    return false;

  const agent: AutoBeAgent<"claude"> = new AutoBeAgent({
    model: "claude",
    vendor: {
      api: new OpenAI({ apiKey: "" }),
      model: "gpt-4.1",
    },
    compiler: (listener) => new AutoBeCompiler(listener),
    histories: await AutoBeExampleStorage.getHistories({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "prisma",
    }),
  });

  const application: ILlmApplication<"claude"> = typia.llm.application<
    IAutoBeInterfaceSchemaReviewApplication,
    "claude"
  >();
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "interfaceOperations"
    | "interfaceSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
    | "previousInterfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeInterfaceSchemaReviewApplication>(),
    source: "interfaceSchemaReview",
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "interfaceOperations",
      "interfaceSchemas",
      "previousAnalysisFiles",
      "previousPrismaSchemas",
      "previousInterfaceOperations",
      "previousInterfaceSchemas",
    ],
    state: agent.getContext().state(),
  });
  preliminary.fixApplication(application);

  const request: IClaudeSchema.IOneOf = application.functions[0].parameters
    .properties.request as IClaudeSchema.IOneOf;
  TestValidator.equals(
    "typeNames",
    request.oneOf
      .filter(ClaudeTypeChecker.isReference)
      .map((r) => r.$ref.split("/").pop()!)
      .sort(),
    [
      "IAutoBeInterfaceSchemaReviewApplication.IComplete",
      "IAutoBePreliminaryGetAnalysisFiles",
      "IAutoBePreliminaryGetPrismaSchemas",
      "IAutoBePreliminaryGetInterfaceOperations",
      "IAutoBePreliminaryGetInterfaceSchemas",
    ].sort(),
  );
  TestValidator.equals(
    "mapping",
    Object.keys(request.discriminator?.mapping ?? {}).sort(),
    [
      "complete",
      "getAnalysisFiles",
      "getPrismaSchemas",
      "getInterfaceOperations",
      "getInterfaceSchemas",
    ].sort(),
  );
  TestValidator.equals(
    "kinds",
    preliminary.getKinds().slice().sort(),
    [
      "analysisFiles",
      "prismaSchemas",
      "interfaceOperations",
      "interfaceSchemas",
    ].sort() as Array<
      | "analysisFiles"
      | "prismaSchemas"
      | "interfaceOperations"
      | "interfaceSchemas"
    >,
  );
};
