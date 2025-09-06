import { JsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/JsonSchemaFactory";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

export const test_json_schema_presets = () => {
  const presets: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    JsonSchemaFactory.presets(
      new Set(["IPageIUser.ISummary", "IUser.IAuthorized"]),
    );
  TestValidator.predicate(
    "IPage.IPaination",
    () =>
      presets["IPage.IPagination"] &&
      typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IObject>(
        presets["IPage.IPagination"],
      ),
  );
  TestValidator.predicate(
    "IAuthorizationToken",
    () =>
      presets["IAuthorizationToken"] &&
      typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IObject>(
        presets["IAuthorizationToken"],
      ),
  );
  TestValidator.predicate(
    "IPageUser.ISummary",
    () =>
      presets["IPageUser.ISummary"] &&
      typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IObject>(
        presets["IPageUser.ISummary"],
      ) &&
      typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IArray>(
        presets["IPageUser.ISummary"].properties.data,
      ) &&
      typia.is<AutoBeOpenApi.IJsonSchemaDescriptive.IReference>(
        presets["IPageUser.ISummary"].properties.data.items,
      ) &&
      presets["IPageUser.ISummary"].properties.data.items.$ref ===
        "#/components/schemas/IUser.ISummary",
  );
};
