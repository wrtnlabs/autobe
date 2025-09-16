# 📅 Date Type Handling Guide for Realize Agent

## 🚨 CRITICAL: Date Type is ABSOLUTELY FORBIDDEN in TypeScript Declarations

This document provides comprehensive guidelines for handling date-related types in the Realize Agent system. Violations of these rules will cause compilation failures.

## 🔴 The Golden Rule: NEVER Use Native Date Type

### ❌ ABSOLUTELY FORBIDDEN
```typescript
// NEVER declare variables with Date type
const now: Date = new Date();                              // ❌ FORBIDDEN
const processDate = (date: Date) => { ... };               // ❌ FORBIDDEN
function getDate(): Date { ... }                           // ❌ FORBIDDEN
interface IUser { created_at: Date; }                      // ❌ FORBIDDEN
type TimeStamp = Date;                                     // ❌ FORBIDDEN
```

### ✅ REQUIRED: Always Use String with Tags
```typescript
// ALWAYS use string with tags.Format<'date-time'>
const now: string & tags.Format<'date-time'> = toISOStringSafe(new Date());
const processDate = (date: string & tags.Format<'date-time'>) => { ... };
function getDate(): string & tags.Format<'date-time'> { ... }
interface IUser { created_at: string & tags.Format<'date-time'>; }
type TimeStamp = string & tags.Format<'date-time'>;
```

## 🛠️ The toISOStringSafe() Function

### Function Signature
```typescript
function toISOStringSafe(
  value: Date | (string & tags.Format<"date-time">)
): string & tags.Format<"date-time">
```

### Purpose
`toISOStringSafe()` is the ONLY approved method for converting Date objects or date strings to ISO strings with proper type branding.

### ⚠️ CRITICAL: Parameter Requirements

**toISOStringSafe REQUIRES a non-null parameter!**
- The function accepts `Date` or ISO string format
- It does NOT accept `null` or `undefined`
- Always check for null/undefined BEFORE calling

```typescript
// ❌ WRONG: Function doesn't accept null
toISOStringSafe(nullableValue)                             // Type error if nullable!

// ✅ CORRECT: Check null first, then call
value ? toISOStringSafe(value) : null                      // Safe null handling
```

### Common Usage Patterns

#### 1. Creating New Timestamps
```typescript
// ✅ For new timestamps
const created_at = toISOStringSafe(new Date());
const updated_at = toISOStringSafe(new Date());

// ✅ Converting existing date strings
const formatted_date = toISOStringSafe(dateString);
```

#### 2. Converting Prisma DateTime Fields
```typescript
// ✅ Converting from Prisma (which returns Date objects)
return {
  created_at: toISOStringSafe(created.created_at),
  updated_at: toISOStringSafe(created.updated_at),
  expires_at: created.expires_at ? toISOStringSafe(created.expires_at) : null,
};
```

#### 3. Processing API Input Dates
```typescript
// ✅ Converting date strings from API input
await MyGlobal.prisma.posts.create({
  data: {
    title: body.title,
    content: body.content,
    published_at: body.published_at ? toISOStringSafe(body.published_at) : null,
    scheduled_at: body.scheduled_at ? toISOStringSafe(body.scheduled_at) : null,
  },
});
```

## 📊 Date Field Patterns in Different Contexts

### 1. Prisma Operations

#### CREATE Operations
```typescript
await MyGlobal.prisma.articles.create({
  data: {
    id: v4() as string & tags.Format<'uuid'>,
    title: body.title,
    content: body.content,
    // Required date fields
    created_at: toISOStringSafe(new Date()),
    updated_at: toISOStringSafe(new Date()),
    // Optional/nullable date fields
    published_at: body.published_at ? toISOStringSafe(body.published_at) : null,
    deleted_at: null,  // If soft delete field exists
  },
});
```

#### UPDATE Operations
```typescript
await MyGlobal.prisma.articles.update({
  where: { id: parameters.id },
  data: {
    title: body.title,
    content: body.content,
    // Always update the updated_at field
    updated_at: toISOStringSafe(new Date()),
    // Conditional date updates
    ...(body.published_at !== undefined && {
      published_at: body.published_at ? toISOStringSafe(body.published_at) : null
    }),
  },
});
```

#### WHERE Clauses with Date Ranges
```typescript
await MyGlobal.prisma.events.findMany({
  where: {
    // Date range queries
    created_at: {
      gte: body.start_date ? toISOStringSafe(body.start_date) : undefined,
      lte: body.end_date ? toISOStringSafe(body.end_date) : undefined,
    },
    // Specific date comparisons
    expires_at: {
      gt: toISOStringSafe(new Date()),  // Events not yet expired
    },
  },
});
```

### 2. Return Object Transformations

#### From Prisma to API Response
```typescript
// Prisma returns Date objects, API expects ISO strings
const users = await MyGlobal.prisma.users.findMany();

return users.map(user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  // Convert all Date fields to ISO strings
  created_at: toISOStringSafe(user.created_at),
  updated_at: toISOStringSafe(user.updated_at),
  last_login_at: user.last_login_at ? toISOStringSafe(user.last_login_at) : null,
  email_verified_at: user.email_verified_at ? toISOStringSafe(user.email_verified_at) : null,
}));
```

### 3. Complex Date Operations

#### Soft Delete Implementation
```typescript
// If schema has deleted_at field (always check first!)
await MyGlobal.prisma.posts.update({
  where: { id: parameters.id },
  data: {
    deleted_at: toISOStringSafe(new Date()),  // Mark as deleted
    updated_at: toISOStringSafe(new Date()),
  },
});

// Querying non-deleted items
await MyGlobal.prisma.posts.findMany({
  where: {
    deleted_at: null,  // Only get non-deleted posts
  },
});
```

#### Date Calculations
```typescript
// Calculate expiry date (30 days from now)
const now = new Date();
const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

await MyGlobal.prisma.subscriptions.create({
  data: {
    user_id: user.id,
    started_at: toISOStringSafe(now),
    expires_at: toISOStringSafe(expiryDate),
  },
});
```

## 🚫 Common Date Type Errors and Solutions

### Error: "Type 'Date' is not assignable to type 'string & tags.Format<'date-time'>'"

**Cause**: Trying to assign a Date object directly without conversion

```typescript
// ❌ WRONG
return {
  created_at: new Date(),  // ERROR!
};

// ✅ CORRECT
return {
  created_at: toISOStringSafe(new Date()),
};
```

### Error: "Argument of type 'null' is not assignable to parameter"

**Cause**: Trying to pass null or undefined to toISOStringSafe

```typescript
// ❌ WRONG
const date = toISOStringSafe(nullableDate);  // Type error if nullable!

// ✅ CORRECT
const date = nullableDate ? toISOStringSafe(nullableDate) : null;
```

### Error: "Type 'string | null' is not assignable to type 'string & tags.Format<'date-time'>'"

**Cause**: Nullable date field being assigned to required date field

```typescript
// ❌ WRONG (if API expects non-nullable)
return {
  created_at: user.created_at ? toISOStringSafe(user.created_at) : null,  // ERROR!
};

// ✅ CORRECT (provide default for required fields)
return {
  created_at: user.created_at 
    ? toISOStringSafe(user.created_at) 
    : toISOStringSafe(new Date()),  // Default to current time
};
```

## 📋 Date Type Checklist

Before implementing any date-related functionality, verify:

1. ✅ **NO Date type declarations** - Search for `: Date` in your code
2. ✅ **All Date objects wrapped in toISOStringSafe()** - Never use .toISOString() directly
3. ✅ **Null checks before toISOStringSafe()** - Function cannot handle null
4. ✅ **Proper type annotations** - Use `string & tags.Format<'date-time'>`
5. ✅ **Schema verification** - Check if date fields actually exist in Prisma schema
6. ✅ **API contract alignment** - Verify if fields are nullable or required in DTOs

## 🎯 Quick Reference

### DO ✅
- `toISOStringSafe(new Date())`
- `toISOStringSafe(dateString)` for existing strings
- `value ? toISOStringSafe(value) : null` for nullable values
- `string & tags.Format<'date-time'>` for type declarations
- Check null/undefined BEFORE calling toISOStringSafe
- Check Prisma schema for date field existence

### DON'T ❌
- `const date: Date = new Date()` - storing Date in variables
- `new Date().toISOString()` - use toISOStringSafe instead
- `toISOStringSafe(nullableValue)` - function doesn't accept null
- `toISOStringSafe()` - function requires a parameter
- Assume date fields exist (like deleted_at)
- Use Date type in function signatures

## 🔍 Exception: new Date() Usage

The ONLY acceptable use of `new Date()` is as an immediate argument to `toISOStringSafe()`:

```typescript
// ✅ ONLY ALLOWED PATTERN
const timestamp = toISOStringSafe(new Date());

// ❌ NEVER STORE Date IN VARIABLE
const now = new Date();  // FORBIDDEN!
const timestamp = toISOStringSafe(now);  // VIOLATION!
```

## 📝 Summary

The Date type handling in Realize Agent follows a strict pattern:
1. **Never** declare Date types in TypeScript
2. **Always** use `string & tags.Format<'date-time'>` for type declarations
3. **Always** use `toISOStringSafe()` for Date/string to ISO conversions
4. **Always** check null/undefined before calling `toISOStringSafe()` - it doesn't accept null
5. **Always** pass a parameter to `toISOStringSafe()` - it's not optional
6. **Always** verify schema before using date fields

Following these rules ensures type safety, prevents runtime errors, and maintains consistency across the entire codebase.