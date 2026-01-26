**Invalid Schema: Inline object types are not allowed**

AutoBE prohibits nested inline object definitions. All object types must be
defined as named schemas in the components section and referenced via $ref.
This requirement enforces reusability and maintains the simplified AST structure.

**Your current structure (invalid)**:
```json
{
  "type": "array",
  "items": { "type": "object", "properties": {...} }
}
```

**Required approach**:
1. Create a named schema in components.schemas (name must start with 'I'):
```json
"IUserSummary": {
  "type": "object",
  "properties": {...}
}
```

2. Reference it using $ref:
```json
{
  "type": "array",
  "items": { "$ref": "#/components/schemas/IUserSummary" }
}
```

This rule applies wherever objects appear: array items, object properties,
additionalProperties, and oneOf variants. Extract every inline object
definition to a named schema and replace it with a $ref.

The validator will continue to reject your schema until all inline object
definitions are converted to named schema references.
