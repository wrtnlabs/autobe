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
      You have defined the JSON schema's type property value as an 
      array type listing all the types that you want, but this is not 
      allowed in the JSON schema.
      
      The JSON schema's type property value must be a single string type.
      In your case, you have to change it to an "oneOf" type which 
      represents a union type.

      So, please change the value as below:

      \`\`\`
      {
        oneOf: [
      ${e.value.type.map((t) => `    { "type": ${JSON.stringify(t)}, ... },`).join("\n")}
        ],${"description" in e.value ? `\n  description: ${JSON.stringify(e.value.description)},` : ""}
      }
      \`\`\`
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
      You have defined an enum property, but it is not allowed in the 
      JSON schema. You have to define it as oneOf type containing multiple
      const types like below:
      
      \`\`\`
      {
        oneOf: [
      ${e.value.enum.map((t) => `    { "const": ${JSON.stringify(t)} },`).join("\n")}
        ],${"description" in e.value ? `\n  description: ${JSON.stringify(e.value.description)},` : ""}
      }
      \`\`\`
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
        You have missed the "x-autobe-specification" property in the JSON schema property.

        The "x-autobe-specification" is an AutoBE-internal field that provides detailed
        implementation guidance for downstream agents (Realize Agent, Test Agent, etc.).
        While "description" is for API consumers (Swagger UI, SDK docs),
        "x-autobe-specification" explains HOW to implement the actual logic.

        **For properties (IJsonSchemaProperty)**, it should include:
        - Database column details and type mapping (when mapped to a column)
        - Computation formula when "x-autobe-database-schema-member" is null:
          - Data sources: ALL columns and/or tables involved
          - Exact algorithm or SQL-like expression (e.g., SUM(items.price * items.quantity))
          - Join conditions between related tables
          - Edge cases: Behavior for nulls, empty sets, defaults

        **Example for a direct column mapping**:
        \`\`\`json
        {
          "email": {
            "type": "string",
            "format": "email",
            "description": "User's email address used for login and notifications.",
            "x-autobe-specification": "Maps to users.email column. Unique constraint enforced at DB level.",
            "x-autobe-database-schema-member": "email"
          }
        }
        \`\`\`

        **Example for a computed property**:
        \`\`\`json
        {
          "totalOrders": {
            "type": "integer",
            "description": "Total number of orders placed by this user.",
            "x-autobe-specification": "Computed by: SELECT COUNT(*) FROM orders WHERE user_id = users.id. Returns 0 if user has no orders.",
            "x-autobe-database-schema-member": null
          }
        }
        \`\`\`

        The specification must be precise enough for downstream agents to implement
        the actual data retrieval or computation without ambiguity.
      `;
    } else {
      // Object-level x-autobe-specification
      e.description = StringUtil.trim`
        You have missed the "x-autobe-specification" property in the JSON schema object type.

        The "x-autobe-specification" is an AutoBE-internal field that provides detailed
        implementation guidance for downstream agents (Realize Agent, Test Agent, etc.).
        While "description" is for API consumers (Swagger UI, SDK docs),
        "x-autobe-specification" explains HOW to implement the actual logic.

        **For object types (IJsonSchemaDescriptive.IObject)**, it should include:
        - Source database tables (primary table and joined tables)
        - Overall query strategy (joins, filters, grouping)
        - Object-level business rules and constraints
        - Edge cases for the object as a whole (not found, empty, etc.)

        **⚠️ IMPORTANT**: Object-level "x-autobe-specification" is for the **object type
        itself**, NOT for individual properties. Each property has its own
        "x-autobe-specification" field. Do NOT duplicate property-level specs here.

        **Example for an object with direct table mapping**:
        \`\`\`json
        {
          "type": "object",
          "description": "User entity with profile information.",
          "x-autobe-specification": "Primary source: users table. Include related profile data via LEFT JOIN user_profiles ON users.id = user_profiles.user_id.",
          "x-autobe-database-schema": "users",
          "properties": { ... }
        }
        \`\`\`

        **Example for a computed/aggregated object (null database mapping)**:
        \`\`\`json
        {
          "type": "object",
          "description": "Sales statistics aggregating data from multiple tables.",
          "x-autobe-specification": "Computed result type. Data sourced by: JOIN sales ON products.id = sales.product_id, grouped by category, with SUM(quantity) and AVG(price) calculations.",
          "x-autobe-database-schema": null,
          "properties": { ... }
        }
        \`\`\`

        The specification must be precise enough for downstream agents to implement
        the actual data retrieval or computation without ambiguity.
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
      You have missed the "description" property in the JSON schema.

      The "description" is the standard OpenAPI field that will be displayed in
      Swagger UI, SDK documentation, and other API documentation tools. It should
      be written for API consumers and focus on WHAT/WHY rather than implementation
      details.

      **Guidelines for writing descriptions**:
      - Reference the corresponding database schema table's documentation
      - Organize into multiple paragraphs for complex types (separated by line breaks)
      - Focus on business meaning, relationships, and constraints
      - Keep the language accessible to API consumers

      **For type schemas**, describe:
      - WHAT: The purpose and business meaning of the type
      - WHY: When and why this type is used
      - Relationships: Connections to other entities in the system
      - Constraints: Validation rules visible to API consumers

      **For property schemas**, describe:
      - WHAT: What this property represents in the business domain
      - WHY: Why this property exists and when it's used
      - Constraints: Validation rules, value ranges, or format requirements
      - For nullable/optional properties: Explain why if DB column is non-null

      **Example**:
      \`\`\`json
      {
        "type": "object",
        "description": "Shopping sale information with detailed metadata.\\n\\nRepresents a product listing that sellers publish for customers to browse and purchase. Contains pricing information, product details, and availability status.\\n\\nDirectly corresponds to the shopping_sales table in the database.",
        ...
      }
      \`\`\`

      All descriptions MUST be written in English.
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
      You have missed the "x-autobe-database-schema" property in the JSON schema.

      The "x-autobe-database-schema" establishes a direct link between this DTO
      schema and a specific database table. This mapping is critical for property
      validation, code generation, and ensuring type consistency.

      **When to set a table name**:
      Set this to a valid table name when the DTO directly represents or derives
      from a specific database table:
      - Entity types (\`IUser\`, \`IOrder\`): Map to their primary table
      - Summary types (\`IUser.ISummary\`): Map to the same table as parent
      - Create/Update DTOs (\`IUser.ICreate\`): Map to the target table

      **When to set \`null\`**:
      Set this to \`null\` when the DTO has no direct database table mapping:
      1. Composite/Aggregated types: DTOs combining data from multiple tables
         (e.g., \`IDashboardSummary\` aggregating user, order, and product stats)
      2. Request parameter types: Search filters, pagination options, sorting criteria
         (e.g., \`IUser.IRequest\`, \`IPageInfo\`)
      3. Computed result types: DTOs representing calculation outputs
         (e.g., \`IRevenueReport\`, \`IAnalyticsResult\`)
      4. Wrapper types: Container types for API responses
         (e.g., \`IPage<T>\`, \`IApiResponse<T>\`)
      5. Pure business logic types: DTOs born from requirements, not database structure
         (e.g., \`ICheckoutSession\`, \`IPaymentIntent\`)

      **CRITICAL**: When this field is \`null\`, the "x-autobe-specification" field
      MUST contain detailed implementation instructions explaining:
      - Source tables and columns involved
      - Join conditions between tables
      - Aggregation formulas (SUM, COUNT, AVG, etc.)
      - Business rules and transformation logic
      - Edge cases (nulls, empty sets, defaults)

      **Example**:
      \`\`\`json
      {
        "type": "object",
        "x-autobe-database-schema": null,
        "x-autobe-specification": "Computed result type. Data sourced by: JOIN sales ON products.id = sales.product_id, grouped by category, with SUM(quantity) and AVG(price) calculations.",
        ...
      }
      \`\`\`

      **WARNING**: When set to a table name, it MUST be an actually existing model
      name from the database schema. Using non-existent schema names causes
      compilation failures.
    `;
    return true;
  }
  return false;
};

const fulfillNoDatabaseSchemaMember = (e: IValidation.IError): boolean => {
  if (
    e.value === undefined &&
    e.path.endsWith(`["x-autobe-database-schema-member"]`)
  ) {
    // no x-autobe-database-schema-member
    e.description = StringUtil.trim`
      You have missed the "x-autobe-database-schema-member" property in the JSON schema.

      The "x-autobe-database-schema-member" specifies the exact database column name
      that this DTO property maps to. This enables end-to-end traceability from DTO
      properties to their database origins and is essential for:
      - Phantom field detection: Verifying every DTO property has a corresponding DB column
      - Code generation: Generating correct database queries and select clauses
      - Type validation: Ensuring property types match database column types

      **When to set a column name**:
      Set this to a valid column name when:
      - The property directly represents a database column value
      - The parent object's "x-autobe-database-schema" points to a valid table
      - The column exists in that table's schema

      **When to set \`null\`**:
      Set this to \`null\` when the property is a **computed property** that:
      1. Aggregates data from the same table: Calculated from multiple columns
         (e.g., \`fullName\` from \`first_name\` + \`last_name\`)
      2. Derives from related tables: Computed from joined/related table data
         (e.g., \`orderCount\` from counting related order records)
      3. Applies business logic transformations: Results from runtime calculations
         (e.g., \`discountedPrice\` from \`price * (1 - discount)\`)
      4. Represents denormalized data: Flattened from nested relations
         (e.g., \`authorName\` from \`post.author.name\`)
      5. Parent object has no database mapping: When the containing object's
         "x-autobe-database-schema" is itself \`null\`

      **CRITICAL**: When this field is \`null\`, the "x-autobe-specification" field
      MUST contain a detailed computation specification explaining:
      - Data sources: ALL columns and/or tables involved
      - Computation formula: Exact algorithm or SQL-like expression
        (e.g., \`SUM(items.price * items.quantity)\`)
      - Join conditions: How related tables connect
      - Edge cases: Behavior for nulls, empty sets, defaults

      **Example**:
      \`\`\`json
      {
        "totalOrders": {
          "type": "integer",
          "description": "Total number of orders placed by this user.",
          "x-autobe-specification": "Computed by: SELECT COUNT(*) FROM orders WHERE user_id = users.id. Returns 0 if user has no orders.",
          "x-autobe-database-schema-member": null
        }
      }
      \`\`\`
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
      You have missed the "required" property in the JSON schema of object type.

      When defining the object type, you have to fill the "required" property
      which lists all the required property names.

      Please fill it with the required fields. If you think that there is
      not any required fields at all, you still have to fill the 
      "required" property even though it becomes an empty array.
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
      You have placed "${props.key}" in the wrong location.

      **Type System Violation**:
      - You defined: \`${props.actual}\` (as a field inside properties)
      - Required type: \`${props.expected}\` (as metadata at object type level)

      The "${props.key}" is NOT a regular field that appears in the
      object's properties, but a METADATA annotation that describes ${props.purpose}. 
      In the AutoBE type system, metadata properties must be defined at the 
      object type level, outside of "properties".

      **Current (Wrong)**:
      \`\`\`json
      {
        "type": "object",
        "properties": {
          ...,
          "${props.key}": ${JSON.stringify(e.value)}  // ❌ Wrong: inside properties
        },
        ...
      }
      \`\`\`

      **Correct**:
      \`\`\`json
      {
        "type": "object",
        "${props.key}": ${JSON.stringify(e.value)},  // ✅ Correct: metadata level
        "properties": { ... },
        ...
      }
      \`\`\`

      **Action Required**:
      1. Remove "${props.key}" from: ${e.path}
      2. Place it at the correct location: ${props.place}

      This is a structural requirement enforced by the AutoBE type system.
      The compiler will continue to reject this schema until corrected.
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
      Nested inline object type definitions are not allowed in AutoBE.

      All object types must be defined as named schemas in the components section
      and referenced using $ref. This enforces the DRY principle, improves reusability,
      and maintains AutoBE's simplified AST structure for AI generation clarity.

      Instead of defining an inline object, create a new named type in components.schemas
      with an interface-style name (starting with 'I'), then reference it with $ref.

      For example, instead of:

      \`\`\`typescript
      {
        "type": "array",
        "items": { "type": "object", "properties": {...} }  // ❌ Wrong
      }
      \`\`\`

      Define a named type and reference it:

      \`\`\`typescript
      // In components.schemas
      "IUserSummary": { 
        "type": "object", 
        "properties": {...} 
      }

      // Then reference it
      {
        "type": "array",
        "items": { "$ref": "#/components/schemas/IUserSummary" }  // ✅ Correct
      }
      \`\`\`

      This applies to array items, object properties, additionalProperties, 
      and oneOf variants. Change the inline object definition to a named schema 
      reference at the next time.
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
