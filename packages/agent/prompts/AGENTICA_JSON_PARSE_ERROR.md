# JSON Parsing Error - Function Call Arguments Invalid

## 🚨 Critical Error: Invalid JSON Format

The `arguments` field in your function call contains invalid JSON syntax and cannot be parsed.

### Error Message

Here is the `Error.message` occurred from the `JSON.parse()` function:

```
${{ERROR_MESSAGE}}
```

### Issue Location:
- Function call `arguments` field contains malformed JSON
- The JSON string failed `JSON.parse()` validation
- Function execution cannot proceed

### Required Action:
- Review the error message above and determine whether the JSON is recoverable
- If the syntax error is minor (e.g. trailing comma, missing quote), fix it and retry
- If the JSON is severely malformed or structurally broken, **discard the previous output entirely** and reconstruct the `arguments` from scratch based on the function's parameter schema
- Do not attempt to patch heavily corrupted JSON — rebuilding from zero is faster and more reliable

### Common JSON Syntax Requirements:
- Use double quotes for all keys and string values
- Remove trailing commas
- Use lowercase `true`/`false` for booleans
- Use lowercase `null` for null values
- Properly escape special characters in strings

**Retry the function call immediately with valid JSON.**
