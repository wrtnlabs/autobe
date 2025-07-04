## Recursive Error Pattern Analysis

### Historical Error Input

You have been provided with `IValidation.IError[][]` containing **previous historical error arrays** from multiple failed correction attempts. Each inner array contains the complete error list from one **previous** correction attempt.

**CRITICAL**: Compare the current `IValidation.IFailure.errors` with this historical data to identify recurring patterns.

```json
${{HISTORICAL_ERRORS}}
```

### Critical Response Protocol

**When error paths recur across current + historical attempts:**

🚨 **NEVER apply the same correction strategy that failed before**

🚨 **Think fundamentally deeper - analyze root architectural causes:**
- Why was the wrong approach chosen repeatedly?
- What business context was misunderstood?
- Which schema requirements were overlooked?
- How should the entire structure be redesigned from first principles?

**For recurring errors, perform complete reconstruction instead of incremental fixes:**
- **🚨 SCHEMA COMPLIANCE FIRST**: Before any business logic, verify all properties exist in schema
- **🚨 ELIMINATE NON-EXISTENT PROPERTIES**: Remove any properties not defined in the schema
- Analyze the complete business scenario requirements
- Examine the full schema interface definition in detail
- Redesign the entire AST structure using proper architectural patterns
- Enhance with comprehensive business context and realistic data

**Success means: the error path never appears in future correction cycles.**

### 🚨 CRITICAL: Schema Property Existence Verification

**Most recurring validation failures stem from using properties that don't exist in the schema.**

**Fatal Pattern Recognition:**
```json
// Historical error pattern that keeps recurring:
{
  "errors": [
    {"path": "input.nonExistentProperty", "expected": "undefined", "value": "some value"},
    {"path": "input.anotherFakeProperty", "expected": "undefined", "value": {...}}
  ]
}
// This indicates properties were added that aren't in the schema!
```

**Before any architectural reconstruction:**

1. **SCHEMA VERIFICATION CHECKPOINT**: 
   ```typescript
   // For EVERY property you plan to include:
   const propertyExists = schema.properties.hasOwnProperty(propertyName);
   if (!propertyExists) {
     // DO NOT INCLUDE THIS PROPERTY - it will cause validation failure
   }
   ```

2. **HISTORICAL ERROR ANALYSIS**:
   - Check if previous errors mention properties that don't exist in schema
   - If so, the root cause is property invention, not incomplete values
   - Solution: Remove non-existent properties, don't add more of them

3. **CLEAN SLATE APPROACH**:
   - Start with an empty object: `{}`
   - Add ONLY properties that exist in `schema.properties`
   - Populate each existing property with appropriate values
   - Never add properties that "should exist" but aren't in schema

## Property Value Completion Analysis

### Root Cause of Recurring Failures

**The majority of unresolved recurring issues stem from two critical problems:**

1. **Incomplete property value assignment** (original problem)
2. **🚨 NEW: Adding properties that don't exist in the schema** (major recurring issue)

**Critical Pattern**: When `IValidation.IError.value` is `undefined`, it indicates that either:
- The property was not properly populated during AST construction, OR
- The property doesn't exist in the schema and should never have been added

### Mandatory Property Analysis Protocol

**For EVERY property in the target schema:**

1. **🚨 SCHEMA EXISTENCE CHECK**: Before any analysis, verify the property exists in schema
   ```typescript
   if (!schema.properties[propertyName]) {
     // STOP - This property doesn't exist, don't include it
     return;
   }
   ```

2. **Type Analysis**: Examine the exact TypeScript type definition
   - Is it a primitive type? (string, number, boolean)
   - Is it a complex object with nested properties?
   - Is it an array? What is the element type?
   - Is it a union type? What are the valid options?
   - Is it optional (`?`) or required?

3. **Value Assignment Strategy**:
   - **Primitive types**: Provide contextually appropriate default values
   - **Object types**: Recursively analyze and populate ALL nested properties
   - **Array types**: Provide at least one representative element
   - **Union types**: Select the most appropriate variant based on context
   - **Optional properties**: Still provide values when contextually relevant

4. **Validation Check**:
   - Before finalizing, verify that NO property has `undefined` value
   - Ensure all required properties are present
   - Validate that provided values match the expected types
   - **🚨 CRITICAL**: Double-check that ALL properties exist in the schema

### Property Completion Examples

```typescript
// ❌ WRONG: Incomplete property assignment
{
  name: "example",
  description: undefined,  // This will cause IValidation.IError.value: undefined
  config: {}              // Empty object missing required nested properties
}

// ❌ FATAL WRONG: Non-existent property assignment
{
  name: "example",
  description: "Valid description",
  email: "test@example.com",  // ❌ FATAL - Property doesn't exist in schema!
  metadata: {                 // ❌ FATAL - Property doesn't exist in schema!
    tags: ["important"]
  }
}

// ✅ CORRECT: Complete property assignment with schema compliance
{
  name: "example",
  description: "A detailed description of the example functionality",
  config: {                   // ✅ Only if 'config' exists in schema
    enabled: true,
    timeout: 5000,
    retries: 3,
    options: {
      debug: false,
      verbose: true
    }
  }
}
```

### Property Value Guidelines

**String Properties**:
- Provide meaningful, contextually relevant values
- Use realistic business terminology
- Include proper formatting (URLs, emails, etc.)

**Numeric Properties**:
- Use realistic ranges and values
- Consider business constraints (positive numbers, percentages, etc.)
- Provide appropriate decimal precision

**Boolean Properties**:
- Choose values that make logical sense in context
- Consider the business impact of true/false choices

**Array Properties**:
- Always provide at least one element
- Use diverse, representative examples
- Ensure all array elements are complete objects

**Object Properties**:
- Recursively apply this analysis to all nested properties
- Maintain consistency across related objects
- Provide comprehensive, realistic data structures

### Completion Verification Checklist

Before submitting any AST structure:

- [ ] **🚨 SCHEMA PROPERTY VERIFICATION**: All properties exist in the provided JSON schema definition
- [ ] **🚨 NO INVENTED PROPERTIES**: No properties were added that aren't explicitly defined in schema
- [ ] All required properties are present
- [ ] No property has `undefined` value
- [ ] All nested objects are completely populated
- [ ] All arrays contain representative elements
- [ ] All values match their expected types
- [ ] Values are contextually appropriate and realistic
- [ ] Property names exactly match the schema definition

**🚨 CRITICAL VERIFICATION PROCESS:**

```typescript
// Before finalizing ANY object, perform this check:
for (const propertyName in myObject) {
  // Step 1: Find this property in the provided schema
  const schemaProperty = schema.properties[propertyName];
  
  // Step 2: If undefined, the property DOES NOT EXIST in schema
  if (schemaProperty === undefined) {
    throw new Error(`FATAL: Property '${propertyName}' not found in schema!`);
  }
  
  // Step 3: Only proceed if property exists in schema
}
```

**⚠️ RECURRING FAILURE PATTERN TO BREAK:**

Many correction cycles fail because agents:
1. ❌ Add "logical" properties that don't exist in schema
2. ❌ Create objects that look complete but violate schema
3. ❌ Generate the same invalid structure repeatedly
4. ❌ Fail to realize the root cause is non-existent properties

**To break this pattern:**
1. ✅ **SCHEMA-FIRST APPROACH**: Start with schema, not with business logic
2. ✅ **PROPERTY EXISTENCE CHECK**: Verify every property exists before using it
3. ✅ **MINIMAL VALID STRUCTURE**: Build only what's in the schema
4. ✅ **INCREMENTAL ENHANCEMENT**: Add properties only if they exist in schema

**Remember**: A single non-existent property can cause the entire correction to fail validation, leading to recurring error cycles. **Schema compliance is more important than business logic completeness.**