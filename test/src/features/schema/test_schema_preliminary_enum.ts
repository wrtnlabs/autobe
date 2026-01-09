import { AutoBeAgent } from "@autobe/agent";
import { AutoBeState } from "@autobe/agent/src/context/AutoBeState";
import { AutoBePreliminaryController } from "@autobe/agent/src/orchestrate/common/AutoBePreliminaryController";
import { IAutoBePreliminaryGetAnalysisFiles } from "@autobe/agent/src/orchestrate/common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "@autobe/agent/src/orchestrate/common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "@autobe/agent/src/orchestrate/common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "@autobe/agent/src/orchestrate/common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBeInterfaceSchemaReviewApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaReviewApplication";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_schema_preliminary_enum = async () => {
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

  const state: AutoBeState = preliminary.getState();
  const $defs: Record<string, ILlmSchema> = application.functions.find(
    (f) => f.name === "process",
  )!.parameters.$defs;
  validateAnalysisFiles(state, $defs);
  validateDatabaseSchemas(state, $defs);
  validateInterfaceOperations(state, $defs);
  validateInterfaceSchemas(state, $defs);
};

const validateAnalysisFiles = (
  state: AutoBeState,
  $defs: Record<string, ILlmSchema>,
): void => {
  const type: ILlmSchema.IObject = $defs[
    typia.reflect.name<IAutoBePreliminaryGetAnalysisFiles>()
  ] as ILlmSchema.IObject;
  TestValidator.predicate(
    "getAnalysisFiles",
    (state.analyze?.files ?? []).every(
      (f) => !!type.properties?.fileNames.description?.includes(f.filename),
    ),
  );
};

const validateDatabaseSchemas = (
  state: AutoBeState,
  $defs: Record<string, ILlmSchema>,
): void => {
  const type: ILlmSchema.IObject = $defs[
    typia.reflect.name<IAutoBePreliminaryGetDatabaseSchemas>()
  ] as ILlmSchema.IObject;
  TestValidator.predicate(
    "getDatabaseSchemas",
    (state.database?.result.data.files ?? [])
      .map((f) => f.models)
      .flat()
      .every(
        (m) => !!type.properties?.schemaNames.description?.includes(m.name),
      ),
  );
};

const validateInterfaceOperations = (
  state: AutoBeState,
  $defs: Record<string, ILlmSchema>,
): void => {
  const type: ILlmSchema.IObject = $defs[
    typia.reflect.name<IAutoBePreliminaryGetInterfaceOperations>()
  ] as ILlmSchema.IObject;
  TestValidator.predicate(
    "interfaceOperations",
    (state.interface?.document.operations ?? []).every(
      (o) =>
        !!type.properties?.endpoints.description?.includes(
          `${o.path} | ${o.method}`,
        ),
    ),
  );
};

const validateInterfaceSchemas = (
  state: AutoBeState,
  $defs: Record<string, ILlmSchema>,
): void => {
  const type: ILlmSchema.IObject = $defs[
    typia.reflect.name<IAutoBePreliminaryGetInterfaceSchemas>()
  ] as ILlmSchema.IObject;
  TestValidator.predicate(
    "interfaceSchemas",
    Object.keys(state.interface?.document.components.schemas ?? {}).every(
      (key) => !!type.properties?.typeNames.description?.includes(key),
    ),
  );
};
