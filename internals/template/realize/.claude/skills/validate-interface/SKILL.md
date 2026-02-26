---
name: validate-interface
description: Validate Controllers and DTOs against requirements (read-only)
allowed-tools: Read, Grep, Glob
---

# Validate Interface (Controllers, DTOs)

Validate that Controllers and DTO interfaces match the requirements specification. This skill only checks for discrepancies - it does NOT modify any files.

## Purpose

Compare requirements documents with interface definitions and report:
- ✅ Matching items
- ❌ Mismatching items (needs fix)
- ⚠️ Items requiring review

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Read Requirements          │
│  /docs/analysis/*.md                │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Read Prisma Schema         │
│  /prisma/schema/*.prisma            │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Read Interfaces & Controllers│
│  /src/api/structures/               │
│  /src/controllers/                  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 4: Compare & Report           │
│  - Missing APIs                     │
│  - Empty interfaces                 │
│  - Type mismatches                  │
│  - Missing DTOs                     │
└─────────────────────────────────────┘
```

---

## Step 1: Read Requirements

```bash
find docs/analysis -name "*.md" -type f
```

Extract required APIs:
- HTTP methods (GET, POST, PATCH, PUT, DELETE)
- URL paths
- Request/response structures
- Authentication requirements

---

## Step 2: Read Prisma Schema

```bash
find prisma/schema -name "*.prisma" -type f
```

Understand data model for DTO validation.

---

## Step 3: Read Current Implementation

```bash
# Controllers
find src/controllers -name "*Controller.ts" -type f

# Interfaces
find src/api/structures -name "I*.ts" -type f
```

---

## Step 4: Validation Checks

### 4.1 API Coverage
For each required API:
- ✅ Controller method exists
- ❌ API missing

### 4.2 Interface Completeness
For each interface file:
- ✅ All properties defined
- ❌ Empty interface `{}`
- ❌ Missing ICreate/IUpdate/ISummary

### 4.3 Type Alignment with Prisma
For each DTO property:
- ✅ Type matches Prisma field
- ❌ Type mismatch
- ❌ Missing nullable annotation
- ⚠️ Missing typia tags

### 4.4 Controller Structure
- ✅ Proper decorators (@TypedRoute, @TypedBody)
- ❌ Missing authentication decorator
- ⚠️ Inconsistent naming

### 4.5 Path Naming
Check for redundant path segments where the same word repeats:
- ❌ `/{word}/{word}s` - e.g., `/admin/admins`, `/user/users`
- ❌ `/{word}/{word}-*` - e.g., `/item/item-details`
- ❌ `/{prefix}/{prefix}-*` - prefix repeated in resource path

Fix by removing redundant segment:
- ✅ `/{word}s` - e.g., `/admins`, `/users`
- ✅ `/{prefix}/{resources}` - no repetition

---

## Output Format

```markdown
# Validation Report: Interfaces

## Summary
- Required APIs: X
- Implemented APIs: Y
- Missing APIs: Z
- Empty interfaces: W

## ✅ Valid Items
- [Controller] `AdminEntitiesController` - All methods present
- [Interface] `IEntity` - Properly defined

## ❌ Issues Found
- [Missing API] `DELETE /admin/entities/:id` - Not implemented
- [Empty Interface] `IEntity.ICreate` - No properties defined
- [Type Mismatch] `IEntity.status` - Expected union type, found string

## ⚠️ Warnings
- [Missing Tag] `IEntity.id` - Should have `tags.Format<"uuid">`
- [Nullable] `IEntity.deleted_at` - Should be `(string & tags.Format<"date-time">) | null`
- [Path Naming] `/{word}/{word}s` pattern detected - Redundant path segment, remove duplication

## Recommendation
Run `/fix-interface` to fix the issues above.
```

---

## Important

**This skill is READ-ONLY.**

- Does NOT modify any files
- Does NOT run any build commands
- Only reports discrepancies

To fix issues, use `/fix-interface` skill.
