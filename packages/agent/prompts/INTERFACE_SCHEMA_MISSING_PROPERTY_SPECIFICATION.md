**Missing Required Field: "x-autobe-specification" (property-level)**

Every property in your schema must have an "x-autobe-specification" field.
This field provides implementation instructions for downstream agents
(Realize Agent, Test Agent) and is distinct from "description" which
serves API documentation purposes.

**What to include**:
- For column-mapped properties: Database column details, constraints, type mapping
- For computed/derived properties:
  - All source columns and tables involved
  - Exact computation formula (e.g., \`SUM(items.price * items.quantity)\`)
  - Join conditions between related tables
  - Edge case handling (nulls, empty sets, default values)

**Example**:
```json
{
  "email": {
    "x-autobe-specification": "Direct mapping from users.email column. Unique constraint enforced at DB level.",
    "description": "User's email address used for login and notifications.",
    "type": "string",
    "format": "email"
  }
}
```

The specification must be precise enough for downstream agents to implement
the data retrieval or computation without ambiguity.

You must add this field. The validator will continue to reject your schema
until every property has an "x-autobe-specification" value.
