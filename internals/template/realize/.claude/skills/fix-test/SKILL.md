---
name: fix-test
description: Fix Test compilation errors
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Fix Test Errors

Fix test file compilation errors according to code conventions.

## FORBIDDEN

**NEVER use:**
- `as` keyword (type assertion)
- `any` type
- `typia.random<EmptyType>()` - generates invalid data

---

## Purpose

Fix compilation errors in test files to ensure `npm run build:test` passes.

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Run Build                  │
│  npm run build:test                 │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Parse Test Errors          │
│  - Empty prepare functions          │
│  - Type mismatches                  │
│  - Missing imports                  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Fix by Convention          │
│  - Fill prepare functions           │
│  - Create generate functions        │
│  - Fix import paths                 │
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
npm run build:test 2>&1 | head -100
```

Capture test-related errors.

---

## Step 2: Find Issues

```bash
# Find empty returns
grep -rn "return {}" test/prepare/ --include="*.ts"

# Find typia.random with potentially empty types
grep -rn "typia.random<" test/ --include="*.ts"
```

---

## Step 3: Fix by Convention

### Fix Empty prepare_random Function

```typescript
// Before
export function prepare_random_{prefix}_{entity}(
  input?: DeepPartial<I{Prefix}{Entity}.ICreate> | undefined,
): I{Prefix}{Entity}.ICreate {
  return {};  // WRONG
}

// After
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { DeepPartial } from "@ORGANIZATION/PROJECT-api/lib/typings/DeepPartial";
import { RandomGenerator } from "@nestia/e2e";
import { randint } from "tstl";
import { v4 } from "uuid";

export function prepare_random_{prefix}_{entity}(
  input?: DeepPartial<I{Prefix}{Entity}.ICreate> | undefined,
): I{Prefix}{Entity}.ICreate {
  return {
    parent_id: input?.parent_id ?? v4(),
    name: input?.name ?? RandomGenerator.name(2),
    title: input?.title ?? RandomGenerator.paragraph(1),
    content: input?.content ?? RandomGenerator.paragraph(3),
    is_public: input?.is_public ?? true,
    status: input?.status ?? "active",
  };
}
```

### Create Missing generate_random Function

```typescript
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { DeepPartial } from "@ORGANIZATION/PROJECT-api/lib/typings/DeepPartial";
import api from "@ORGANIZATION/PROJECT-api";

import { prepare_random_{prefix}_{entity} } from "../prepare/prepare_random_{prefix}_{entity}";

export async function generate_random_{prefix}_{entity}(
  connection: api.IConnection,
  input?: DeepPartial<I{Prefix}{Entity}.ICreate> | undefined,
): Promise<I{Prefix}{Entity}> {
  const body = prepare_random_{prefix}_{entity}(input);
  return api.functional.{prefix}.{path}.create(connection, body);
}
```

### Field Generation Patterns

| Field Type | Generation Pattern |
|------------|-------------------|
| UUID | `v4()` |
| Name/Title | `RandomGenerator.name(2)` |
| Paragraph | `RandomGenerator.paragraph(1)` |
| Email | `` `${RandomGenerator.string(8)}@example.com` `` |
| URL | `` `https://example.com/${RandomGenerator.string(10)}` `` |
| Integer | `randint(min, max)` |
| Boolean | `Math.random() > 0.5` |
| Date (ISO) | `new Date().toISOString()` |
| Union Type | `(["val1", "val2"] as const)[randint(0, 1)]` |

### Replace typia.random with prepare function

```typescript
// Before
const data = typia.random<I{Prefix}{Entity}.ICreate>();

// After
import { prepare_random_{prefix}_{entity} } from "../prepare/prepare_random_{prefix}_{entity}";

const data = prepare_random_{prefix}_{entity}({
  status: "active",  // Can override specific values
});
```

---

## Step 4: Verify

```bash
npm run build:test
```

Repeat Steps 2-4 until no test build errors.

---

## Common Fixes

| Error Pattern | Fix |
|---------------|-----|
| Empty `return {}` | Fill with proper random generators |
| `typia.random<EmptyType>` | Use prepare_random function |
| Missing generate function | Create matching generate_random |
| Import error | Fix import path |

---

## Exit Condition

- `npm run build:test` completes with no errors
- All prepare functions return complete objects
- All generate functions exist for prepare functions
- No `typia.random` with empty types
