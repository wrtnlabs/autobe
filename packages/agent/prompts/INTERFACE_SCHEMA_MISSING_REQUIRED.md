**Missing Required Field: "required"**

Every object type schema must have a "required" property that lists
which property names are mandatory. This field must be present even
when all properties are optional - in that case, provide an empty array.

Example with required properties:
```json
{
  "type": "object",
  "required": ["id", "name", "email"],
  "properties": { ... }
}
```

Example with no required properties:
```json
{
  "type": "object",
  "required": [],
  "properties": { ... }
}
```

You must add this field. The validator will continue to reject your schema
until every object type has a "required" array.