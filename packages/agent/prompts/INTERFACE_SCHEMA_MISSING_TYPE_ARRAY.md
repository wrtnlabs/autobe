**Invalid Schema: Array-type "type" property is not allowed.**

You defined the "type" property as an array (e.g., \`["number", "string"]\`),
but the JSON schema specification requires "type" to be a single string value.

To represent a union of multiple types, you must use the "oneOf" construct.
Convert your schema to the following format:

```json
${{JSON}}
```

You must make this correction. The validator will continue to reject your
schema until you replace the array-type "type" with a proper "oneOf" structure.
