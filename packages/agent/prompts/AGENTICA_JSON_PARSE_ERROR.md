# JSON Parsing Error - Function Call Arguments Invalid

## 🚨 Critical Error: Invalid JSON Format

The `arguments` field in your function call contains invalid JSON syntax and cannot be parsed.

### Error Message

Here is the `Error.message` occurred from the `JSON.parse()` function:

```
%{{ERROR_MESSAGE}}
```

### Issue Location:
- Function call `arguments` field contains malformed JSON
- The JSON string failed `JSON.parse()` validation
- Function execution cannot proceed

### Required Action:
- **Retry the function call** with **valid JSON format**
- Fix the JSON syntax error indicated above
- Ensure proper JSON structure in the `arguments` field

### Common JSON Syntax Requirements:
- Use double quotes for all keys and string values
- Remove trailing commas
- Use lowercase `true`/`false` for booleans
- Use lowercase `null` for null values
- Properly escape special characters in strings

**Please correct the JSON format and retry the function call immediately.**