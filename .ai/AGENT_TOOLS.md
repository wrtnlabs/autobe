# Agent Tools

## Tool Philosophy

AutoBE agents generate structured output through Function Calling. Tools define functions agents can call, specifying parameters and return types with JSON schemas. This provides type-safe data structures instead of free-form text.

The core principle of Tool design is **clarity**. Tool names, descriptions, and parameter types must be very clear. They guide the LLM to select tools correctly and pass accurate parameters. Ambiguous Tool definitions lead to incorrect calls or Schema Validation errors.

Tools must be **atomic**. One Tool performs one clear task. Bundling multiple tasks into one Tool increases complexity and confuses agents. Define multiple Tools if needed and have agents call them sequentially.

Tools must be **validatable**. JSON schemas specify parameter types, required fields, and value ranges. If the LLM generates output outside the schema, it's automatically rejected and retried. This ensures output quality.

## Function Calling Mechanism

AutoBE uses Anthropic Claude's Function Calling feature.

### Tool Definition

Tools are defined in TypeScript using types from `@agentica/core`. Each Tool has a name, description, and parameter schema.

```typescript
{
  name: "generate_api_endpoint",
  description: "Generate a NestJS API endpoint implementation",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "API endpoint path (e.g., /api/users/:id)"
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        description: "HTTP method"
      },
      implementation: {
        type: "string",
        description: "Complete TypeScript implementation code"
      }
    },
    required: ["path", "method", "implementation"]
  }
}
```

Tool names start with verbs to clearly express actions. Use clear verbs like `generate`, `create`, `validate`, `correct`. Agents should immediately understand the tool's purpose.

Tool descriptions should be specific and detailed. Not just "generates API" but "converts OpenAPI Operation to NestJS Controller method, implements Service layer logic, and includes Prisma-based database access".

Parameter schemas are strictly defined. Specify type, description, and constraints for all fields. Use `enum` to restrict allowed values, `pattern` to validate string formats. The `required` array specifies mandatory fields.

### Tool Invocation

Agents call Tools according to System Prompt instructions. When the LLM decides to call a Tool, it outputs the Tool name and parameters as JSON.

AutoBE receives Tool calls in streaming mode. Receives in real-time as the LLM generates Tool parameters and validates immediately upon completion. Streaming shortens response time and improves user experience.

Tool call validation is JSON schema-based. Checks if parameters match schema, all required fields exist, and types are correct. On validation failure, provides clear error message feedback to LLM and requests retry.

On successful Tool call, result is published as an event. Event includes Tool name, parameters, and result, stored in state. Frontend subscribes to events to update UI.

### Tool Response

Tool results can be returned to the LLM. Typically AutoBE's Tool calls are final output so no additional response is needed, but in some cases the LLM must interpret Tool results and perform follow-up tasks.

For example, calling a Compiler validation Tool returns compilation success status and error messages. The LLM analyzes this and generates corrected code if errors exist. This iterative process is implemented through Tool responses.

Tool responses are also structured. Clearly distinguish success/failure status, result data, and error messages. Maintain consistent format so LLM can parse responses and respond appropriately.

## Tool Categories

AutoBE's Tools are categorized by function.

### Generation Tools

Tools that generate code or documents: `generate_analysis_document`, `generate_prisma_schema`, `generate_api_operation`, `generate_test_code`, `generate_implementation`, etc.

Generation Tools require **complete output**. Must generate complete compilable files, not partial code snippets. Must include all imports, type definitions, and implementation.

Generation Tools clearly **reference context**. Parameters and descriptions specify which inputs to reference for output generation. For example, `generate_implementation` receives `openapi_operation_id` parameter to implement a specific OpenAPI Operation.

Generation Tools include **metadata**. Return not just generated code but also file path, description, and dependency information. This allows Orchestrators to properly handle output.

### Review Tools

Tools that review and improve generated output: `review_analysis`, `review_schema`, `review_operation`, etc.

Review Tools require **critical evaluation**. Not just approval, but finding actual problems and suggesting improvements. Validate consistency, completeness, and quality.

Review Tools return **specific feedback**. Not "good" or "bad" but concrete points like "Type definition on Line 15 mismatches Prisma schema", "DELETE operation missing soft delete field".

Review Tools can provide **fix proposals**. Return not just problem identification but corrected versions. Orchestrators can apply directly or make final decisions by comparing with original.

### Correction Tools

Tools that fix compilation errors: `correct_prisma_error`, `correct_typescript_error`, `correct_schema_validation_error`, etc.

Correction Tools receive **error context** as parameters. Provide error messages, error locations, and related code snippets so LLM can make accurate corrections.

Correction Tools follow **minimal change principle**. Don't rewrite entire code, just fix the error part. This preserves existing working code and avoids introducing new errors.

Correction Tools apply **learning**. To avoid repeating the same mistakes as previous errors, analyze error patterns and include preventive measures. Add "previously occurred errors" to System Prompts to prevent recurrence.

### Planning Tools

Tools that establish work plans: `plan_analysis`, `plan_api_endpoints`, `plan_test_scenarios`, etc.

Planning Tools establish **priorities**. Among multiple tasks, specify which to perform first and what dependencies exist. Orchestrators determine execution order based on this.

Planning Tools can provide **resource estimates**. Predict time and token usage for each task. Inform users of estimated total pipeline duration.

Planning Tools must be **validatable**. Verify if plan is executable and conflict-free. Reject impossible plans and suggest revisions.

## Schema Design Best Practices

To design effective Tool schemas, follow these principles.

### Type Safety

All fields must have clear types. Use one of `string`, `number`, `boolean`, `array`, `object`. Avoid ambiguous types like `any` or `unknown`.

Define complex types as `object` and specify sub-fields with `properties`. Clearly define even nested structures so LLM generates correct format.

Also specify array item types. Define like `type: "array", items: { type: "string" }`. Define complex object arrays as `items: { type: "object", properties: {...} }`.

Use enums actively. For fields allowing only limited values, list possible values in `enum` array. Prevents LLM from generating invalid values.

### Descriptions

All fields should have detailed descriptions. Include field purpose, format, and examples. LLM reads descriptions and generates correct values.

Write descriptions **imperatively**. Not "user name" but concretely like "user's unique identifier, only lowercase letters and numbers, 3-20 characters length".

Include examples. Provide actual values like `example: "john_doe"`, `example: 42`. LLM references examples to generate values in similar format.

Specify constraints. Include min/max length, regex patterns, value ranges in descriptions. Use JSON Schema keywords like `minLength`, `maxLength`, `pattern`.

### Required Fields

Specify required fields in `required` array. If LLM omits required fields, Schema Validation error occurs and retries.

Carefully decide required status. Too many required fields burden LLM, too few produce incomplete output. Specify only minimum required fields, leave rest optional.

Optional fields can have defaults. Use `default` keyword in schema to specify default values. If LLM omits the field, default value is used.

### Validation Rules

Utilize JSON Schema validation rules. Use `minLength`, `maxLength`, `minimum`, `maximum`, `pattern`, `format` etc. to limit value ranges.

Use regex patterns to validate string formats. For example, API paths validate with patterns like `/^\/api\/[a-z-]+$/`. Wrong formats are detected immediately.

Custom validation logic can also be added. After Schema Validation passes, validate values with additional business logic. For example, verify referenced tables actually exist in Prisma schema.

### Nested Structures

Represent complex data as nested objects. Hierarchical structure conveys meaning more clearly than flat structure.

```typescript
{
  type: "object",
  properties: {
    endpoint: {
      type: "object",
      properties: {
        path: { type: "string" },
        method: { type: "string", enum: ["GET", "POST", ...] }
      },
      required: ["path", "method"]
    },
    implementation: {
      type: "object",
      properties: {
        controller: { type: "string" },
        service: { type: "string" }
      },
      required: ["controller", "service"]
    }
  },
  required: ["endpoint", "implementation"]
}
```

Maintain appropriate nesting depth. Too deep and LLM misses structure, too shallow and meaning is ambiguous. Generally 2-3 levels is appropriate.

## Tool Evolution

Tools evolve with agents.

### Adding New Tools

Add new Tools when new functionality is needed. Rather than forcing expansion of existing Tools, define new Tools with clear purpose.

When adding new Tools, consider:
- Is there duplication with existing Tools?
- Is the Tool's responsibility clear?
- Is the schema sufficiently detailed?
- Is Tool usage explained in System Prompts?

Start new Tools small. Initially define only minimum parameters and expand gradually through use. Don't try to create perfect Tools at once.

### Deprecating Tools

Remove unused Tools. Keep codebase clean and prevent LLM from selecting wrong Tools.

Deprecation proceeds gradually. First add "DEPRECATED: Use xxx instead" to Tool description. After sufficient period, remove completely. Delete Tool mentions from System Prompts too.

### Refactoring Tools

Tool schemas can be refactored. Analyze usage patterns to improve schemas. Remove rarely used fields, add frequently needed fields.

Proceed breaking changes carefully. If much existing Tool usage code exists, add new version Tool and migrate gradually. Remove old version after all usage updated.

### Monitoring Usage

Collect Tool usage statistics. Track which Tools are frequently called, which frequently fail. Identify and improve problematic Tools.

Analyze Schema Validation errors. If errors frequently occur in specific fields, schema or description may be unclear. Improve to reduce error rate.

Also measure Tool call time. If some Tools are particularly slow, parameters may be too complex or format difficult for LLM to generate. Consider simplification.

## Integration with System Prompts

Tools and System Prompts collaborate closely.

System Prompts guide when and how to use Tools. Include instructions like "call generate_implementation Tool upon task completion", "fill all required fields and write code completely".

Tool schemas and prompt descriptions must match. If prompt says "put API path in path field", schema must have `path` field defined. Mismatch confuses LLM.

Include Tool examples in prompts. Show actual Tool call examples so LLM understands exact format. Output quality greatly improves through few-shot learning.

## Testing Tools

Tools should be independently testable.

### Schema Validation Testing

Test schema validation with various inputs. Verify valid inputs pass and invalid inputs are rejected.

Test edge cases. Try empty strings, null, undefined, very long strings, negative numbers, special characters. Verify schema catches all exceptions.

### Integration Testing

Test Tools integrated with actual LLM. Provide Tool to LLM with simple System Prompt and verify correct calls.

Test multiple scenarios. Try normal cases, complex cases, edge cases. Verify LLM consistently generates correct output.

### Error Handling Testing

Verify appropriate error messages are generated on Schema Validation failure. Verify messages are clear and LLM can understand and correct them.

Test retry logic. Verify LLM receives error feedback and generates corrected output. Verify most errors resolve in 1-2 retries.

## Performance Considerations

Tool design affects performance.

Complex schemas consume more time and tokens for LLM generation. Include only necessary fields and remove unnecessary complexity.

Optimize schema size. Very detailed descriptions are good, but excess consumes context. Write only core information concisely.

Consider Tool call frequency. Especially optimize frequently called Tools. Simplify schemas and apply Prompt Caching for efficiency.

Consider batch processing. If multiple similar tasks can be processed in one Tool call, use array parameters. For example, instead of 10 individual calls for APIs, pass array at once. However, this makes individual retries difficult, so consider tradeoffs.

---

Tools are the interface between AI agents and the rest of AutoBE. Well-designed tools make agents reliable and maintainable. Invest time in schema design - it pays off in code quality and system stability.
