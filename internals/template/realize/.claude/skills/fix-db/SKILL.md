---
name: fix-db
description: Fix Prisma schema compilation errors
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Fix Database Schema Errors

Fix Prisma schema compilation errors according to code conventions.

## FORBIDDEN

**NEVER use:**
- Prisma `enum` types (use String with TypeScript union types instead)

---

## Purpose

Fix compilation errors in Prisma schema files to ensure `npm run build:prisma` passes.

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Run Build                  │
│  npm run build:prisma               │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Parse Errors               │
│  - Syntax errors                    │
│  - Relation errors                  │
│  - Type errors                      │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Fix by Convention          │
│  Apply code conventions             │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 4: Re-run Build               │
│  Loop until 0 errors                │
└─────────────────────────────────────┘
```

---

## Step 1: Run Build

```bash
npm run build:prisma 2>&1
```

Capture all error output.

---

## Step 2: Parse Errors

Common error types:
- `Error parsing attribute`: Syntax error in decorator
- `Error validating field`: Invalid field type
- `Error validating relation`: Missing or invalid relation

---

## Step 3: Fix by Convention

### Primary Key Convention
```prisma
// Standard
id String @id @db.Uuid
```

### Timestamp Convention
```prisma
created_at DateTime @db.Timestamptz
updated_at DateTime @db.Timestamptz
deleted_at DateTime? @db.Timestamptz
```

### Foreign Key Convention
```prisma
{parent}_id String @db.Uuid
{parent} {prefix}_{parents} @relation(fields: [{parent}_id], references: [id], onDelete: Cascade)
```

### Union Type Fields (NOT enum)
```prisma
// DO NOT use Prisma enum
status String  // "active" | "inactive" defined in TypeScript

// WRONG - Never do this
// enum Status { ACTIVE INACTIVE }
```

### Self-referential Relation
```prisma
parent_id String? @db.Uuid
parent {Model}? @relation("recursive", fields: [parent_id], references: [id], onDelete: Cascade)
children {Model}[] @relation("recursive")
```

### Index Convention
```prisma
@@index([{parent}_id, status])
@@index([name(ops: raw("gin_trgm_ops"))], type: Gin)
```

---

## Step 4: Verify

```bash
npm run build:prisma
```

Repeat Steps 2-4 until no errors.

---

## Common Fixes

| Error Pattern | Fix |
|---------------|-----|
| Missing relation | Add `@relation` with fields and references |
| Invalid type | Use correct Prisma types (String, Int, DateTime, etc.) |
| Duplicate model | Remove duplicate or rename |
| Missing @@map | Add table name mapping |
| Enum error | Replace with String type |

---

## Exit Condition

- `npm run build:prisma` completes with no errors
- All models properly defined
- All relations valid
