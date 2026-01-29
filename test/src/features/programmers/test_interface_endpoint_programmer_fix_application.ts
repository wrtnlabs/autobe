import { AutoBeInterfaceEndpointProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceEndpointProgrammer";
import { IAutoBeInterfaceEndpointWriteApplication } from "@autobe/agent/src/orchestrate/interface/structures/IAutoBeInterfaceEndpointWriteApplication";
import {
  AutoBeAnalyzeActor,
  AutoBeInterfaceEndpointDesign,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { ILlmApplication, ILlmSchema, LlmTypeChecker } from "@samchon/openapi";
import typia from "typia";

export const test_interface_endpoint_programmer_fix_application = (): void => {
  const actors: AutoBeAnalyzeActor[] = [
    { name: "user", kind: "member", description: "Regular user" },
    { name: "admin", kind: "admin", description: "Administrator" },
    { name: "seller", kind: "member", description: "Seller" },
  ];

  const application: ILlmApplication =
    typia.llm.application<IAutoBeInterfaceEndpointWriteApplication>();

  AutoBeInterfaceEndpointProgrammer.fixApplication({
    application,
    actors,
  });

  const $defs: Record<string, ILlmSchema> =
    application.functions[0].parameters.$defs;
  const design: ILlmSchema | undefined =
    $defs[typia.reflect.name<AutoBeInterfaceEndpointDesign>()];

  TestValidator.predicate("design should exist", () => design !== undefined);
  TestValidator.predicate(
    "design should be object type",
    () => design !== undefined && LlmTypeChecker.isObject(design),
  );

  if (design !== undefined && LlmTypeChecker.isObject(design)) {
    const property: ILlmSchema | undefined =
      design.properties["authorizationActors"];

    TestValidator.predicate(
      "authorizationActors should exist",
      () => property !== undefined,
    );
    TestValidator.predicate(
      "authorizationActors should be array type",
      () => property !== undefined && LlmTypeChecker.isArray(property),
    );

    if (property !== undefined && LlmTypeChecker.isArray(property)) {
      const items = property.items as ILlmSchema.IString;

      TestValidator.predicate(
        "items should be string type with enum",
        () => items.type === "string" && items.enum !== undefined,
      );

      TestValidator.equals(
        "items.enum should contain actor names",
        [...(items.enum ?? [])].sort(),
        ["admin", "seller", "user"],
      );
    }
  }
};
