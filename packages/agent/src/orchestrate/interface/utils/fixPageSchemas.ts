import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

export const fixPageSchemas = (input: unknown, path: string): void => {
  if (isObject(input) === false || isObject(input[path]) === false) return;

  if (input[path].description) delete input[path].description;
  if (input[path].required) delete input[path].required;
  for (const key of Object.keys(input[path])) {
    if (
      key.startsWith("IPage") === false ||
      key.startsWith("IPage.") === true ||
      key === "IPage"
    )
      continue;
    const data: string = key.substring("IPage".length);
    input[path][key] = getPageSchema(data);
  }
};

const isObject = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null;

const getPageSchema = (
  key: string,
): AutoBeOpenApi.IJsonSchemaDescriptive.IObject => ({
  type: "object",
  properties: {
    pagination: {
      $ref: "#/components/schemas/IPage.IPagination",
      description: "Page information.",
    },
    data: {
      type: "array",
      items: {
        $ref: `#/components/schemas/${key}`,
      },
      description: "List of records.",
    },
  },
  required: ["pagination", "data"],
  description: StringUtil.trim`
    A page.

    Collection of records with pagination information.
  `,
});
