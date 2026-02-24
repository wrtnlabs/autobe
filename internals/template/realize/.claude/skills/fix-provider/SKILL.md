---
name: fix-provider
description: Fix Provider, Collector, Transformer compilation errors
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Fix Provider Errors

Fix provider, collector, and transformer compilation errors according to code conventions.

## FORBIDDEN

**NEVER use:**
- `as` keyword (type assertion)
- `any` type

Fix type issues by properly defining Collectors and Transformers.

---

## Purpose

Fix compilation errors in provider files to ensure `npm run build:main` passes.

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Run Build                  │
│  npm run build:main                 │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Parse Provider Errors      │
│  - as any usage                     │
│  - Type mismatches                  │
│  - Missing imports                  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Fix by Convention          │
│  - Create Collectors                │
│  - Create Transformers              │
│  - Remove type assertions           │
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

Capture provider-related errors.

---

## Step 2: Find Issues

```bash
# Find as any usage
grep -rn "as any" src/providers/ --include="*.ts"

# Find any type
grep -rn ": any" src/providers/ --include="*.ts"

# Find type assertions
grep -rn " as " src/providers/ --include="*.ts" | grep -v "import"
```

---

## Step 3: Fix by Convention

### Create Collector (if missing)

```typescript
// src/collectors/{Prefix}{Entity}Collector.ts
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { Prisma } from "@prisma/sdk";
import { v4 } from "uuid";

export namespace {Prefix}{Entity}Collector {
  export function collect(props: {
    body: I{Prefix}{Entity}.ICreate;
  }): Prisma.{table_name}CreateInput {
    const id = v4();
    const now = new Date();

    return {
      id,
      field_name: props.body.field_name,
      optional_field: props.body.optional_field ?? null,
      parent: props.body.parent_id
        ? { connect: { id: props.body.parent_id } }
        : undefined,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
  }
}
```

### Create Transformer (if missing)

```typescript
// src/transformers/{Prefix}{Entity}Transformer.ts
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { {table_name} } from "@prisma/sdk";

export namespace {Prefix}{Entity}Transformer {
  export function transform(record: {table_name}): I{Prefix}{Entity} {
    return {
      id: record.id,
      name: record.name,
      status: record.status,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
      deleted_at: record.deleted_at
        ? record.deleted_at.toISOString()
        : null,
    };
  }

  export function toSummary(record: {table_name}): I{Prefix}{Entity}.ISummary {
    return {
      id: record.id,
      name: record.name,
      status: record.status,
      created_at: record.created_at.toISOString(),
    };
  }

  export function transformMany(records: {table_name}[]): I{Prefix}{Entity}[] {
    return records.map(transform);
  }

  export function toSummaryList(records: {table_name}[]): I{Prefix}{Entity}.ISummary[] {
    return records.map(toSummary);
  }
}
```

### Fix POST Provider

```typescript
// Before
const createData: any = { ... };
return { id: created.id as string & tags.Format<"uuid">, ... };

// After
import { {Prefix}{Entity}Collector } from "../collectors/{Prefix}{Entity}Collector";
import { {Prefix}{Entity}Transformer } from "../transformers/{Prefix}{Entity}Transformer";

export async function post{Prefix}{Entity}(props: {
  body: I{Prefix}{Entity}.ICreate;
}): Promise<I{Prefix}{Entity}> {
  const data = {Prefix}{Entity}Collector.collect({ body: props.body });
  const created = await MyGlobal.prisma.{table}.create({ data });
  return {Prefix}{Entity}Transformer.transform(created);
}
```

### Fix GET Provider

```typescript
// Before
return {
  id: record.id as string & tags.Format<"uuid">,
  ...
};

// After
import { {Prefix}{Entity}Transformer } from "../transformers/{Prefix}{Entity}Transformer";

export async function get{Prefix}{Entity}(props: { id: string }): Promise<I{Prefix}{Entity}> {
  const record = await MyGlobal.prisma.{table}.findUnique({ where: { id: props.id } });
  if (!record) throw new HttpException("Not found", 404);
  return {Prefix}{Entity}Transformer.transform(record);
}
```

---

## Step 4: Verify

```bash
npm run build:main
```

Repeat Steps 2-4 until no provider errors.

---

## Common Fixes

| Error Pattern | Fix |
|---------------|-----|
| `as any` | Create proper Collector/Transformer |
| Type assertion | Use Transformer for conversion |
| Missing import | Add import statement |
| Null reference | Add null check before transform |

---

## Exit Condition

- `npm run build:main` completes with no errors
- No `as any` in providers
- No type assertions in providers
- All providers use Collector + Transformer
