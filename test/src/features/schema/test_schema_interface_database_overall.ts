import { AutoBeInterfaceSchemaProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaProgrammer";
import { IAutoBeInterfaceComplementApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceComplementApplication";
import { IAutoBeInterfaceSchemaApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaApplication";
import { IAutoBeInterfaceSchemaRefineApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaRefineApplication";
import { IAutoBeInterfaceSchemaReviewApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaReviewApplication";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeDatabase, AutoBeHistory } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import {
  ILlmApplication,
  ILlmFunction,
  ILlmSchema,
  LlmTypeChecker,
} from "@samchon/openapi";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_schema_interface_database_overall = async () => {
  if (
    (await AutoBeExampleStorage.has({
      vendor: TestGlobal.vendorModel,
      project: "todo",
      phase: "interface",
    })) === false
  )
    return false;

  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: TestGlobal.vendorModel,
    project: "todo",
    phase: "database",
  });
  const everyModels: AutoBeDatabase.IModel[] =
    histories
      .find((h) => h.type === "database")
      ?.result.data.files.flatMap((f) => f.models) ?? [];

  const assert = (application: ILlmApplication) => {
    const func: ILlmFunction = application.functions[0];
    AutoBeInterfaceSchemaProgrammer.fixApplication({
      application,
      everyModels,
      model: null,
    });
    LlmTypeChecker.visit({
      $defs: func.parameters.$defs,
      schema: func.parameters,
      closure: (next) => {
        if (LlmTypeChecker.isObject(next) === false) return;

        const property: ILlmSchema | undefined =
          next.properties["x-autobe-database-schema"];
        if (property === undefined) return;
        else if (LlmTypeChecker.isAnyOf(property) === false)
          throw new Error(
            `Property "x-autobe-database-schema" must be an anyOf schema.`,
          );

        const value: ILlmSchema | undefined = property.anyOf.find((sch) =>
          LlmTypeChecker.isString(sch),
        );
        if (value === undefined)
          throw new Error(
            `Property "x-autobe-database-schema" must contain a string schema in its anyOf.`,
          );

        TestValidator.equals(
          "x-autobe-database-schema",
          (value.enum ?? []).slice().sort(),
          everyModels.map((m) => m.name).sort(),
        );
      },
    });
    LlmTypeChecker.visit({
      $defs: func.parameters.$defs,
      schema: func.parameters,
      closure: (next) => {
        if (LlmTypeChecker.isObject(next) === false) return;

        const property: ILlmSchema | undefined =
          next.properties["x-autobe-database-schema-property"];
        if (property === undefined) return;
        else if (LlmTypeChecker.isAnyOf(property) === false)
          throw new Error(
            `Property "x-autobe-database-schema-property" must be an anyOf schema.`,
          );

        const value: ILlmSchema | undefined = property.anyOf.find((sch) =>
          LlmTypeChecker.isString(sch),
        );
        if (value === undefined)
          throw new Error(
            `Property "x-autobe-database-schema-property" must contain a string schema in its anyOf.`,
          );

        TestValidator.equals(
          "x-autobe-database-schema-property",
          value.enum ?? [],
          [],
        );
      },
    });
  };
  assert(typia.llm.application<IAutoBeInterfaceSchemaApplication>());
  assert(typia.llm.application<IAutoBeInterfaceSchemaRefineApplication>());
  assert(typia.llm.application<IAutoBeInterfaceSchemaReviewApplication>());
  assert(typia.llm.application<IAutoBeInterfaceComplementApplication>());
};
