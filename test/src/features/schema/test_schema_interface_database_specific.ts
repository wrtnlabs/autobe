import { AutoBeInterfaceSchemaProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaProgrammer";
import { IAutoBeInterfaceSchemaApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaApplication";
import { IAutoBeInterfaceSchemaComplementApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceSchemaComplementApplication";
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

export const test_schema_interface_database_specific = async () => {
  if (
    (await AutoBeExampleStorage.has({
      vendor: "qwen/qwen3-next-80b-a3b-instruct",
      project: "todo",
      phase: "database",
    })) === false
  )
    return false;

  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: "qwen/qwen3-next-80b-a3b-instruct",
    project: "todo",
    phase: "database",
  });
  const everyModels: AutoBeDatabase.IModel[] =
    histories
      .find((h) => h.type === "database")
      ?.result.data.files.flatMap((f) => f.models) ?? [];
  const model: AutoBeDatabase.IModel = everyModels[0];
  const members: string[] =
    AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaMembers({
      everyModels,
      model,
    }).map((m) => m.key);

  const assert = (application: ILlmApplication) => {
    const func: ILlmFunction = application.functions[0];
    AutoBeInterfaceSchemaProgrammer.fixApplication({
      application,
      everyModels,
      model,
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

        TestValidator.equals("x-autobe-database-schema", value.enum ?? [], [
          model.name,
        ]);
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
          (value.enum ?? []).slice().sort(),
          members.slice().sort(),
        );
      },
    });
  };
  assert(typia.llm.application<IAutoBeInterfaceSchemaApplication>());
  assert(typia.llm.application<IAutoBeInterfaceSchemaRefineApplication>());
  assert(typia.llm.application<IAutoBeInterfaceSchemaReviewApplication>());
  assert(typia.llm.application<IAutoBeInterfaceSchemaComplementApplication>());
};
