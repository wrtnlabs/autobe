import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_json_schema_presets = () => {
  const presets: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    AutoBeJsonSchemaFactory.presets(
      new Set(["IPageIUser.ISummary", "IUser.IAuthorized"]),
    );

  TestValidator.predicate("IPage.IPagination", () =>
    typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IObject>(
      presets["IPage.IPagination"],
    ),
  );
  TestValidator.predicate("IAuthorizationToken", () =>
    typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IObject>(
      presets["IAuthorizationToken"],
    ),
  );
  TestValidator.predicate(
    "IPageIUser.ISummary",
    () =>
      typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IObject>(
        presets["IPageIUser.ISummary"],
      ) &&
      typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IArray>(
        presets["IPageIUser.ISummary"].properties.data,
      ) &&
      typia.is<AutoBeOpenApi.IJsonSchema.IReference>(
        presets["IPageIUser.ISummary"].properties.data.items,
      ) &&
      presets["IPageIUser.ISummary"].properties.data.items.$ref ===
        "#/components/schemas/IUser.ISummary",
  );
};
