---
name: fix-interface
description: Fix Interface and Controller compilation errors
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Fix Interface Errors

Fix interface and controller compilation errors according to code conventions.

## FORBIDDEN

**NEVER use:**
- `as` keyword (type assertion)
- `any` type

Fix type issues by properly defining interfaces.

## DO NOT MODIFY

**Leave as-is:**
- `console.log` in Controller catch blocks
- `console.error` in Controller catch blocks

These are intentional and should not be changed to NestJS Logger.

---

## Purpose

Fix compilation errors in interface and controller files to ensure `npm run build:main` passes.

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Run Build                  │
│  npm run build:main                 │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Parse Interface Errors     │
│  - Empty interfaces {}              │
│  - Type mismatches                  │
│  - Missing properties               │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Fix by Convention          │
│  - Fill empty interfaces            │
│  - Add typia tags                   │
│  - Fix nullable types               │
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
npm run build:main 2>&1 | head -100
```

Capture interface-related errors.

---

## Step 2: Parse Errors

Common error patterns:
- `Type '{}' is not assignable` → Empty interface
- `Property 'X' does not exist on type '{}'` → Empty interface
- `Type 'string' is not assignable to type 'string & Format<"uuid">'` → Missing typia tag

---

## Step 3: Fix by Convention

### Empty Interface Fix
Read Prisma schema and fill interface:

```typescript
// Before
export type IEntity = {};

// After
import { tags } from "typia";

export type IEntity = {
  id: string & tags.Format<"uuid">;
  name: string;
  status: "active" | "inactive";
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
};
```

### ICreate Convention
```typescript
export namespace IEntity {
  export type ICreate = {
    name: string;
    status?: "active" | "inactive";  // optional with default
  };
}
```

### IUpdate Convention
```typescript
export namespace IEntity {
  export type IUpdate = {
    name?: string;
    status?: "active" | "inactive";
  };
}
```

### ISummary Convention
```typescript
export namespace IEntity {
  export type ISummary = {
    id: string & tags.Format<"uuid">;
    name: string;
    status: "active" | "inactive";
    created_at: string & tags.Format<"date-time">;
  };
}
```

### IRequest Convention
```typescript
export namespace IEntity {
  export type IRequest = {
    page?: number & tags.Minimum<1>;
    limit?: number & tags.Minimum<1> & tags.Maximum<100>;
    search?: string;
    status?: "active" | "inactive";
  };
}
```

### Typia Tags
```typescript
// UUID
id: string & tags.Format<"uuid">;

// Email
email: string & tags.Format<"email">;

// URL
url: string & tags.Format<"uri">;

// DateTime
created_at: string & tags.Format<"date-time">;

// Numeric constraints
page: number & tags.Minimum<1>;
limit: number & tags.Minimum<1> & tags.Maximum<100>;
```

### Nullable Types
```typescript
// Nullable field
deleted_at: (string & tags.Format<"date-time">) | null;

// Optional nullable field
description?: string | null;
```

### Path Naming Fix
Fix redundant path segments where the same word repeats:

```typescript
// Before - redundant word in path: /{word}/{word}s
@Controller("{prefix}/{word}/{word}s")
export class {Word}{Word}sController { ... }

// After - remove redundant segment
@Controller("{prefix}/{word}s")
export class {Word}sController { ... }
```

Pattern to fix:
- `/{word}/{word}s` → `/{word}s`
- `/{word}/{word}-*` → `/{word}-*` or `/{word}/*`

When fixing paths, also update:
1. Controller `@Controller()` decorator
2. Controller class name
3. Controller file name and directory
4. Related provider function names
5. Test file paths and API calls

---

## Step 4: Verify

```bash
npm run build:main
```

Repeat Steps 2-4 until no interface errors.

---

## Common Fixes

| Error Pattern | Fix |
|---------------|-----|
| Empty interface `{}` | Read Prisma schema, define all fields |
| Missing typia tag | Add appropriate `tags.Format<>` |
| Nullable mismatch | Add `\| null` for nullable fields |
| Missing namespace | Add namespace with ICreate, IUpdate, etc. |
| Redundant path `/{word}/{word}s` | Remove duplication: `/{word}s` |

---

## Exit Condition

- `npm run build:main` completes with no interface errors
- All interfaces properly defined
- All typia tags applied
- No redundant path segments (`/{word}/{word}s` pattern)
