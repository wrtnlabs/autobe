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
```json
{
  "type": "object",
  "description": "User entity with profile information.",
  "x-autobe-specification": "Primary source: users table. Include related profile data via LEFT JOIN user_profiles ON users.id = user_profiles.user_id.",
  "x-autobe-database-schema": "users",
  "properties": { ... }
}
```

The specification must be precise enough for downstream agents to implement
the data retrieval or computation without ambiguity.

You must add this field. The validator will continue to reject your schema
until every object type has an "x-autobe-specification" value.