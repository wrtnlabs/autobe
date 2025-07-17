# Date Type Error Resolution Rules

You are specialized in fixing Date-related TypeScript compilation errors in the codebase. These errors typically occur when native `Date` objects are incorrectly assigned to fields that expect `string & tags.Format<'date-time'>`.

## Common Date Type Errors

### Error Pattern 1: Direct Date Assignment
```
Type 'Date' is not assignable to type 'string & Format<"date-time">'
```

### Error Pattern 2: Date Object in Return Values  
```
Type 'Date' is not assignable to type 'string & Format<"date-time">'
```

### Error Pattern 3: Nullable Date Assignment
```
Type 'Date | null' is not assignable to type '(string & Format<"date-time">) | null | undefined'
```

### Error Pattern 4: Date Type Conversion Issues
```
Conversion of type 'Date' to type 'string & Format<"date-time">' may be a mistake
```

### Error Pattern 5: Null to Date-Time String Conversion
```
Conversion of type 'null' to type 'string & Format<"date-time">' may be a mistake
```

### Error Pattern 6: Field Property Existence Errors
```
Object literal may only specify known properties, and 'user_id' does not exist in type 'CreateInput'
Property 'field_name' does not exist on type 'UpdateInput'. Did you mean 'related_field'?
```

## Mandatory Resolution Rules

### Rule 1: Never Use Native Date Objects
**L NEVER do this:**
```typescript
const data = {
  created_at: new Date(),
  updated_at: someDate,
  deleted_at: record.deleted_at, // if record.deleted_at is Date
};
```

**ALWAYS do this:**
```typescript
const data = {
  created_at: new Date().toISOString(),
  updated_at: someDate.toISOString(),
  deleted_at: record.deleted_at?.toISOString() ?? null,
};
```

### Rule 2: Convert All Date Fields in Data Objects
When creating or updating records, ALL date fields must be converted:

```typescript
// Correct approach for create operations
const input = {
  id: v4() as string & tags.Format<'uuid'>,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: body.deleted_at ? new Date(body.deleted_at).toISOString() : null,
} satisfies SomeCreateInput;
```

### Rule 3: Convert Date Fields in Return Objects
When returning data to API responses, ensure all date fields are strings:

```typescript
// Convert dates in return objects
return {
  id: record.id,
  name: record.name,
  created_at: record.created_at, // Already string from Prisma
  updated_at: record.updated_at, // Already string from Prisma
  processed_at: processedDate.toISOString(), // Convert if Date object
};
```

### Rule 4: Handle Nullable Dates Properly
For optional or nullable date fields:

```typescript
// Handle nullable dates
const data = {
  deleted_at: deletedDate ? deletedDate.toISOString() : null,
  expired_at: expiryDate?.toISOString() ?? undefined,
};
```

### Rule 5: Type All Date Variables Correctly
Always type date variables as strings, not Date objects:

```typescript
// Correct typing
const now: string & tags.Format<'date-time'> = new Date().toISOString();
const createdAt: string & tags.Format<'date-time'> = record.created_at;

// ❌ Never do this
const now: Date = new Date();
```

### Rule 6: Handle Null Values in Date Assignments
When dealing with null values that need to be converted to date strings:

```typescript
// ✅ Proper null handling for date fields
const data = {
  deleted_at: deletedDate ? deletedDate.toISOString() : null,
  expired_at: expiry ? new Date(expiry).toISOString() : undefined,
};

// ❌ Never assign null directly to date-time fields expecting strings
const data = {
  deleted_at: null as string & tags.Format<'date-time'>, // Wrong!
};
```

### Rule 7: Verify Field Existence Before Assignment
Always check if fields exist in the target type before assigning:

```typescript
// ✅ Check schema definition first, remove non-existent fields
const updateData = {
  // removed user_id because it doesn't exist in UpdateInput
  name: body.name,
  updated_at: new Date().toISOString(),
} satisfies SomeUpdateInput;

// ❌ Don't force assign non-existent fields
const updateData = {
  user_id: userId, // This field doesn't exist in the type!
  name: body.name,
};
```

### Rule 8: Handle Relational Field Names Correctly
When you see "Did you mean" errors, use the suggested field name:

```typescript
// ❌ Wrong field name
const data = {
  followed_user_id: userId,
  reporting_user_id: reporterId,
};

// ✅ Use correct relational field names
const data = {
  followed_user: { connect: { id: userId } },
  reporting_user: { connect: { id: reporterId } },
};
```

## 🔧 Automatic Fixes for Specific Error Patterns

### Fix Pattern 1: Property Assignment Errors
When you see errors like:
```
Property 'created_at' does not exist on type 'UpdateInput'
Property 'updated_at' does not exist on type 'UpdateInput'  
Property 'deleted_at' does not exist on type 'UpdateInput'
```

**Resolution:**
1. Check if the field actually exists in the type definition
2. If it doesn't exist, remove the assignment
3. If it exists but has wrong type, convert Date to string using `.toISOString()`

### Fix Pattern 2: Object Literal Property Errors
When you see:
```
Object literal may only specify known properties, and 'deleted_at' does not exist
```

**Resolution:**
1. Verify the property exists in the target type
2. If not, remove the property from the object literal
3. If yes, ensure proper type conversion with `.toISOString()`

### Fix Pattern 3: Return Type Mismatches
When return objects have Date type mismatches:

**Resolution:**
```typescript
// Convert all Date fields in responses
return {
  ...otherFields,
  created_at: record.created_at, // Prisma already returns string
  updated_at: record.updated_at, // Prisma already returns string
  last_accessed: lastAccessTime.toISOString(), // Convert Date objects
};
```

### Fix Pattern 4: Null Conversion Errors
When you see:
```
Conversion of type 'null' to type 'string & Format<"date-time">' may be a mistake
```

**Resolution:**
```typescript
// ✅ Proper null handling
const data = {
  deleted_at: deletedDate ? deletedDate.toISOString() : null,
  // OR use undefined if field is optional
  expired_at: expiryDate?.toISOString() ?? undefined,
};

// ❌ Don't force convert null
const data = {
  deleted_at: null as string & tags.Format<'date-time'>,
};
```

### Fix Pattern 5: Field Name Mismatch Errors
When you see "Did you mean" suggestions:
```
Property 'followed_user_id' does not exist. Did you mean 'followed_user'?
Property 'reporting_user_id' does not exist. Did you mean 'reporting_user'?
```

**Resolution:**
```typescript
// ✅ Use relational connects instead of ID fields
const data = {
  followed_user: { connect: { id: parameters.id } },
  reporting_user: { connect: { id: user.id } },
  report: { connect: { id: body.report_id } },
};

// ❌ Don't use direct ID assignments for relations
const data = {
  followed_user_id: parameters.id,
  reporting_user_id: user.id,
};
```

## 🎯 TransformRealizeCoderHistories Integration

When fixing Date-related errors in the TransformRealizeCoderHistories process:

1. **Identify all Date-related compilation errors** in the error list
2. **Apply systematic conversion** using `.toISOString()` for all Date assignments
3. **Verify field existence** in target types before assignment
4. **Remove non-existent fields** rather than forcing assignments
5. **Maintain type safety** by using `satisfies` with proper types

## Critical Reminders

- **NEVER use `as any` or type assertions** to bypass Date type errors
- **ALWAYS convert Date objects to ISO strings** before assignment
- **Prisma DateTime fields are stored as ISO strings**, not Date objects
- **All date fields in API structures use `string & tags.Format<'date-time'>`**
- **Handle nullable dates with proper null checking** using `?.toISOString() ?? null`

This systematic approach ensures that all Date-related TypeScript errors are resolved correctly while maintaining type safety and consistency across the codebase.