import { StringUtil } from "@autobe/utils";
import typia, { IValidation } from "typia";

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
      fulfillNoDatabaseSchemaMember(e) ||
      fulfillObjectMetadataMisplacement(e) ||
      fulfillNestedObjectError(e);
};

const fulfillTypeAsArrayError = (e: IValidation.IError): boolean => {
  if (
    // type := ["number", "string", ...] case
    isInvalidJsonSchema(e) &&
    typia.is<{ type: string[] }>(e.value) === true
  ) {
    e.description = StringUtil.trim`
      **Invalid Schema: Array-type "type" property is not allowed.**

      You defined the "type" property as an array (e.g., \`["number", "string"]\`),
      but the JSON schema specification requires "type" to be a single string value.

      To represent a union of multiple types, you must use the "oneOf" construct.
      Convert your schema to the following format:

      \`\`\`json
      {
        "oneOf": [
      ${e.value.type.map((t) => `    { "type": ${JSON.stringify(t)}, ... },`).join("\n")}
        ],${"description" in e.value ? `\n  "description": ${JSON.stringify(e.value.description)},` : ""}
      }
      \`\`\`

      You must make this correction. The validator will continue to reject your
      schema until you replace the array-type "type" with a proper "oneOf" structure.
    `;
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
    const isPropertyLevel = e.path.includes(".properties");

    if (isPropertyLevel) {
      // Property-level x-autobe-specification
      e.description = StringUtil.trim`
        **Missing Required Field: "x-autobe-specification" (property-level)**

        Every property in your schema must have an "x-autobe-specification" field.
        This field provides implementation instructions for downstream agents
        (Realize Agent, Test Agent) and is distinct from "description" which
        serves API documentation purposes.

        **What to include**:
        - For column-mapped properties: Database column details, constraints, type mapping
        - For computed properties (when "x-autobe-database-schema-property" is null):
          - All source columns and tables involved
          - Exact computation formula (e.g., \`SUM(items.price * items.quantity)\`)
          - Join conditions between related tables
          - Edge case handling (nulls, empty sets, default values)

        **Example**:
        \`\`\`json
        {
          "email": {
            "type": "string",
            "format": "email",
            "description": "User's email address used for login and notifications.",
            "x-autobe-specification": "Maps to users.email column. Unique constraint enforced at DB level.",
            "x-autobe-database-schema-property": "email"
          }
        }
        \`\`\`

        The specification must be precise enough for downstream agents to implement
        the data retrieval or computation without ambiguity.

        You must add this field. The validator will continue to reject your schema
        until every property has an "x-autobe-specification" value.
      `;
    } else {
      // Object-level x-autobe-specification
      e.description = StringUtil.trim`
        **Missing Required Field: "x-autobe-specification" (object-level)**

        Every object type in your schema must have an "x-autobe-specification" field.
        This field provides implementation instructions for downstream agents
        (Realize Agent, Test Agent) and is distinct from "description" which
        serves API documentation purposes.

        **What to include**:
        - Source database tables (primary table and joined tables)
        - Overall query strategy (joins, filters, grouping)
        - Object-level business rules and constraints
        - Edge cases for the object as a whole (not found, empty, etc.)

        **Important**: Object-level "x-autobe-specification" describes the object type
        as a whole. Do NOT repeat individual property specifications here - each
        property has its own "x-autobe-specification" field.

        **Example**:
        \`\`\`json
        {
          "type": "object",
          "description": "User entity with profile information.",
          "x-autobe-specification": "Primary source: users table. Include related profile data via LEFT JOIN user_profiles ON users.id = user_profiles.user_id.",
          "x-autobe-database-schema": "users",
          "properties": { ... }
        }
        \`\`\`

        The specification must be precise enough for downstream agents to implement
        the data retrieval or computation without ambiguity.

        You must add this field. The validator will continue to reject your schema
        until every object type has an "x-autobe-specification" value.
      `;
    }
    return true;
  }
  return false;
};

const fulfillNoDescriptionError = (e: IValidation.IError): boolean => {
  if (e.value === undefined && e.path.endsWith(".description")) {
    // no description
    e.description = StringUtil.trim`
      **Missing Required Field: "description"**

      Every schema element must have a "description" field. This is the standard
      OpenAPI field that appears in Swagger UI, SDK documentation, and other
      API documentation tools. Write descriptions for API consumers, focusing
      on WHAT and WHY rather than implementation details.

      **Writing guidelines**:
      - Reference the corresponding database schema table's documentation
      - Use multiple paragraphs for complex types (separated by line breaks)
      - Focus on business meaning, relationships, and constraints
      - Keep language accessible to API consumers
      - Write all descriptions in English

      **For type schemas**: Describe the purpose, business meaning, when/why the
      type is used, relationships to other entities, and consumer-visible constraints.

      **For property schemas**: Describe what the property represents in the
      business domain, why it exists, validation rules, value ranges, and format
      requirements. For nullable/optional properties, explain the reason if the
      underlying DB column is non-null.

      You must add this field. The validator will continue to reject your schema
      until every schema element has a "description" value.
    `;
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
    e.description = StringUtil.trim`
      **Missing Required Field: "x-autobe-database-schema"**

      Every object type schema must have an "x-autobe-database-schema" field that
      links the DTO to a specific database table. This mapping enables property
      validation, code generation, and type consistency across the system.

      **Set to a table name** when the DTO represents or derives from a database table:
      - Entity types (\`IUser\`, \`IOrder\`): Map to their primary table
      - Summary types (\`IUser.ISummary\`): Map to the same table as the parent entity
      - Create/Update DTOs (\`IUser.ICreate\`): Map to the target table

      **Set to \`null\`** when the DTO has no direct table mapping:
      - Composite types combining data from multiple tables (e.g., \`IDashboardSummary\`)
      - Request parameter types (e.g., \`IUser.IRequest\`, \`IPageInfo\`)
      - Computed result types (e.g., \`IRevenueReport\`)
      - Wrapper types (e.g., \`IPage<T>\`)
      - Pure business logic types (e.g., \`ICheckoutSession\`)

      **When set to \`null\`**: The "x-autobe-specification" field must contain
      detailed implementation instructions including source tables, join conditions,
      aggregation formulas, and edge case handling.

      **When set to a table name**: The name must exactly match an existing model
      in the database schema. Non-existent names cause compilation failures.

      You must add this field. The validator will continue to reject your schema
      until every object type has an "x-autobe-database-schema" value (table name or null).
    `;
    return true;
  }
  return false;
};

const fulfillNoDatabaseSchemaMember = (e: IValidation.IError): boolean => {
  if (
    e.value === undefined &&
    e.path.endsWith(`["x-autobe-database-schema-property"]`)
  ) {
    // no x-autobe-database-schema-property
    e.description = StringUtil.trim`
      **Missing Required Field: "x-autobe-database-schema-property"**

      Every property must have an "x-autobe-database-schema-property" field that
      specifies the exact database column or relation this property maps to.
      This enables phantom field detection, correct query generation, and type validation.

      **Set to a column/relation name** when:
      - The property directly represents a database column value
      - The parent object's "x-autobe-database-schema" points to a valid table
      - The column or relation actually exists in that table's schema

      **Set to \`null\`** when the property is computed:
      - Aggregated from multiple columns (e.g., \`fullName\` from \`first_name\` + \`last_name\`)
      - Derived from related tables (e.g., \`orderCount\` from counting orders)
      - Result of runtime calculations (e.g., \`discountedPrice\`)
      - Denormalized from nested relations (e.g., \`authorName\` from \`post.author.name\`)
      - Parent object has no database mapping (\`x-autobe-database-schema\` is null)

      **When set to \`null\`**: The "x-autobe-specification" field must contain
      the complete computation specification: all source columns/tables, the exact
      formula or algorithm, join conditions, and edge case handling.

      **When set to a property name**: The name must exactly match an existing column
      or relation in the database schema. Do not guess or imagine property names.
      If validation rejects a property name, that property does not exist in the schema.

      You must add this field. The validator will continue to reject your schema
      until every property has an "x-autobe-database-schema-property" value (property name or null).
    `;
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
    e.description = StringUtil.trim`
      **Missing Required Field: "required"**

      Every object type schema must have a "required" property that lists
      which property names are mandatory. This field must be present even
      when all properties are optional - in that case, provide an empty array.

      Example with required properties:
      \`\`\`json
      {
        "type": "object",
        "required": ["id", "name", "email"],
        "properties": { ... }
      }
      \`\`\`

      Example with no required properties:
      \`\`\`json
      {
        "type": "object",
        "required": [],
        "properties": { ... }
      }
      \`\`\`

      You must add this field. The validator will continue to reject your schema
      until every object type has a "required" array.
    `;
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
    e.description = StringUtil.trim`
      **Invalid Schema: Inline object types are not allowed**

      AutoBE prohibits nested inline object definitions. All object types must be
      defined as named schemas in the components section and referenced via $ref.
      This requirement enforces reusability and maintains the simplified AST structure.

      **Your current structure (invalid)**:
      \`\`\`json
      {
        "type": "array",
        "items": { "type": "object", "properties": {...} }
      }
      \`\`\`

      **Required approach**:
      1. Create a named schema in components.schemas (name must start with 'I'):
      \`\`\`json
      "IUserSummary": {
        "type": "object",
        "properties": {...}
      }
      \`\`\`

      2. Reference it using $ref:
      \`\`\`json
      {
        "type": "array",
        "items": { "$ref": "#/components/schemas/IUserSummary" }
      }
      \`\`\`

      This rule applies wherever objects appear: array items, object properties,
      additionalProperties, and oneOf variants. Extract every inline object
      definition to a named schema and replace it with a $ref.

      The validator will continue to reject your schema until all inline object
      definitions are converted to named schema references.
    `;
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
