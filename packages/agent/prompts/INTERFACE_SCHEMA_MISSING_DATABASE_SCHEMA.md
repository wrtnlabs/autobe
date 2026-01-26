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
