import { StringUtil } from "@autobe/utils";
import typia, { IValidation } from "typia";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const fulfillJsonSchemaErrorMessages = (
  errors: IValidation.IError[],
): void => {
  for (const e of errors)
    fulfillTypeAsArrayError(e) ||
      fulfillEnumInsteadOfConstError(e) ||
      fulfillNoRequiredError(e) ||
      fulfillNoSpecificationError(e) ||
      fulfillNoDescriptionError(e) ||
      fulfillNoDatabaseSchema(e) ||
      fulfillObjectMetadataMisplacement(e) ||
      fulfillNestedObjectError(e);
};

const fulfillTypeAsArrayError = (e: IValidation.IError): boolean => {
  if (
    // type := ["number", "string", ...] case
    isInvalidJsonSchema(e) &&
    typia.is<{ type: string[] }>(e.value) === true
  ) {
    e.description =
      AutoBeSystemPromptConstant.INTERFACE_SCHEMA_MISSING_TYPE_ARRAY.replace(
        "${{JSON}}",
        StringUtil.trim`
        {
          "oneOf": [
        ${e.value.type.map((t) => `    { "type": ${JSON.stringify(t)}, ... },`).join("\n")}
          ],${"description" in e.value ? `\n  "description": ${JSON.stringify(e.value.description)},` : ""}
        }
      `,
      );
    return true;
  }
  return false;
};

const fulfillEnumInsteadOfConstError = (e: IValidation.IError): boolean => {
  if (
    // enum to const
    isInvalidJsonSchema(e) &&
    typia.is<{ enum: any[] }>(e.value) === true
  ) {
    e.description = StringUtil.trim`
      **Invalid Schema: "enum" keyword is not supported in AutoBE.**

      The "enum" keyword is prohibited. AutoBE requires you to use the "oneOf"
      construct with individual "const" values instead. This design ensures
      better type safety and documentation clarity.

      Convert your schema to the following format:

      \`\`\`json
      {
        "oneOf": [
      ${e.value.enum.map((t) => `    { "const": ${JSON.stringify(t)} },`).join("\n")}
        ],${"description" in e.value ? `\n  "description": ${JSON.stringify(e.value.description)},` : ""}
      }
      \`\`\`

      You must make this correction. The validator will continue to reject your
      schema until you replace "enum" with the proper "oneOf" + "const" structure.
    `;
    return true;
  }
  return false;
};

const fulfillNoSpecificationError = (e: IValidation.IError): boolean => {
  if (e.value === undefined && e.path.endsWith(`["x-autobe-specification"]`)) {
    e.description = e.path.includes(".properties")
      ? AutoBeSystemPromptConstant.INTERFACE_SCHEMA_MISSING_PROPERTY_SPECIFICATION
      : AutoBeSystemPromptConstant.INTERFACE_SCHEMA_MISSING_OBJECT_SPECIFICATION;
    return false;
  }
  return true;
};

const fulfillNoDescriptionError = (e: IValidation.IError): boolean => {
  if (e.value === undefined && e.path.endsWith(".description")) {
    // no description
    e.description =
      AutoBeSystemPromptConstant.INTERFACE_SCHEMA_MISSING_DESCRIPTION;
    return true;
  }
  return false;
};

const fulfillNoDatabaseSchema = (e: IValidation.IError): boolean => {
  if (
    e.value === undefined &&
    e.path.endsWith(`["x-autobe-database-schema"]`)
  ) {
    // no x-autobe-database-schema
    e.description =
      AutoBeSystemPromptConstant.INTERFACE_SCHEMA_MISSING_DATABASE_SCHEMA;
    return true;
  }
  return false;
};

const fulfillNoRequiredError = (e: IValidation.IError): boolean => {
  if (
    // no required property
    e.value === undefined &&
    e.path.endsWith(".required") &&
    e.expected === "Array<string>"
  ) {
    e.description =
      AutoBeSystemPromptConstant.INTERFACE_SCHEMA_MISSING_REQUIRED;
    return true;
  }
  return false;
};

const fulfillObjectMetadataMisplacement = (e: IValidation.IError): boolean => {
  if (isInvalidJsonSchema(e) === false) return false;

  const validate = (props: {
    key: string;
    expected: string;
    actual: string;
    place: string;
    purpose: string;
  }): boolean => {
    e.expected = "undefined";
    e.description = StringUtil.trim`
      **Structural Error: "${props.key}" is in the wrong location**

      You placed "${props.key}" inside the "properties" object, but it is a
      metadata field that belongs at the object type level, outside of "properties".

      - Your placement: \`${props.actual}\`
      - Correct placement: \`${props.expected}\`

      The "${props.key}" field describes ${props.purpose} and must be placed
      at the schema's top level alongside "type" and "properties".

      **Your current structure (incorrect)**:
      \`\`\`json
      {
        "type": "object",
        "properties": {
          ...,
          "${props.key}": ${JSON.stringify(e.value)}
        }
      }
      \`\`\`

      **Required structure**:
      \`\`\`json
      {
        "type": "object",
        "${props.key}": ${JSON.stringify(e.value)},
        "properties": { ... }
      }
      \`\`\`

      Move "${props.key}" from ${e.path} to ${props.place}. The validator will
      continue to reject your schema until this structural correction is made.
    `;
    return true;
  };

  if (
    e.path.endsWith(`.properties["x-autobe-database-schema"]`) === true &&
    typeof e.value === "string"
  )
    return validate({
      key: "x-autobe-database-schema",
      expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject["x-autobe-database-schema"]`,
      actual: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties["x-autobe-database-schema"]`,
      place: e.path.replace(
        `.properties["x-autobe-database-schema"]`,
        `["x-autobe-database-schema"]`,
      ),
      purpose: "which database table this schema type corresponds to",
    });
  else if (
    e.path.endsWith(`.properties.required`) === true &&
    Array.isArray(e.value) === true
  )
    return validate({
      key: "required",
      expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.required`,
      actual: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties.required`,
      place: e.path.replace(`.properties.required`, `.required`),
      purpose: "which properties are mandatory",
    });
  else if (
    e.path.endsWith(`.properties.description`) === true &&
    typeof e.value === "string"
  )
    return validate({
      key: "description",
      expected: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.description`,
      actual: `AutoBeOpenApi.IJsonSchemaDescriptive.IObject.properties.description`,
      place: e.path.replace(`.properties.description`, `.description`),
      purpose: "the entire schema",
    });
  return false;
};

const fulfillNestedObjectError = (e: IValidation.IError): boolean => {
  if (isExcludedObjectType(e) === true) {
    // nested object
    e.description =
      AutoBeSystemPromptConstant.INTERFACE_SCHEMA_MISSING_NESTED_OBJECT;
    return true;
  }
  return false;
};

const isExcludedObjectType = (error: IValidation.IError): boolean =>
  error.expected.includes("|") &&
  ((error.expected.includes("AutoBeOpenApi.IJsonSchema.IConstant") &&
    error.expected.includes("AutoBeOpenApi.IJsonSchema.IArray")) ||
    (error.expected.includes(
      "AutoBeOpenApi.IJsonSchemaDescriptive.IConstant",
    ) &&
      error.expected.includes("AutoBeOpenApi.IJsonSchemaDescriptive.IArray")) ||
    (error.expected.includes("AutoBeOpenApi.IJsonSchemaProperty.IConstant") &&
      error.expected.includes("AutoBeOpenApi.IJsonSchemaProperty.IArray"))) &&
  typia.is<{
    type: "object";
  }>(error.value) === true;

const isInvalidJsonSchema = (e: IValidation.IError): boolean =>
  e.expected.startsWith("(") &&
  e.expected.endsWith(")") &&
  e.expected.includes("|") &&
  e.expected
    .split("|")
    .map((s) => s.trim())
    .some(
      (s) =>
        s.startsWith("AutoBeOpenApi.IJsonSchema.") ||
        s.startsWith("AutoBeOpenApi.IJsonSchemaDescriptive."),
    );
