import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";

export const test_compiler_interface_preset = (): void => {
  const preset = AutoBeJsonSchemaFactory.presets(
    new Set(["IPageIShoppingSale.ISummary"]),
  );
  TestValidator.equals(
    "keys",
    Object.keys(preset).sort(),
    [
      "IEntity",
      "IPage.IPagination",
      "IPage.IRequest",
      "IAuthorizationToken",
      "IPageIShoppingSale.ISummary",
    ].sort(),
  );

  const schema: AutoBeOpenApi.IJsonSchemaDescriptive =
    preset["IPageIShoppingSale.ISummary"];
  if (AutoBeOpenApiTypeChecker.isObject(schema) === false)
    throw new Error("pagination schema is not an object"); // unreachable

  TestValidator.equals(
    "$ref",
    {
      type: "array",
      items: {
        $ref: "#/components/schemas/IShoppingSale.ISummary",
      },
    } satisfies AutoBeOpenApi.IJsonSchema.IArray,
    schema.properties.data as any,
  );
};
