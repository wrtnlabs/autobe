# Phase 1: Implementation Flow

Detailed steps for implementing the feature.

---

## Step 1.1: Analyze Requirements

From `$ARGUMENTS`, extract:
- **Entity name**: What is being created/managed?
- **Operations**: CRUD? Special actions?
- **Relationships**: Parent entities? Child entities?
- **Constraints**: Validation rules? Business rules?

---

## Step 1.2: Update Prisma Schema (if needed)

If new entity or fields required:

```prisma
model {prefix}_{entities} {
  id String @id @db.Uuid

  // Fields
  name String
  status String  // "active" | "inactive"

  // Foreign keys
  {parent}_id String @db.Uuid

  // Timestamps
  created_at DateTime @db.Timestamptz
  updated_at DateTime @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz

  // Relations
  {parent} {prefix}_{parents} @relation(fields: [{parent}_id], references: [id], onDelete: Cascade)

  // Indexes
  @@index([{parent}_id, status])
}
```

Then run:
```bash
npm run build:prisma
```

---

## Step 1.3: Create/Update Interface

Location: `/src/api/structures/I{Prefix}{Entity}.ts`

```typescript
import { tags } from "typia";

export type I{Prefix}{Entity} = {
  id: string & tags.Format<"uuid">;
  name: string;
  status: "active" | "inactive";
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  deleted_at: (string & tags.Format<"date-time">) | null;
};

export namespace I{Prefix}{Entity} {
  export type ICreate = {
    name: string;
    status?: "active" | "inactive";
  };

  export type IUpdate = {
    name?: string;
    status?: "active" | "inactive";
  };

  export type ISummary = {
    id: string & tags.Format<"uuid">;
    name: string;
    status: "active" | "inactive";
  };

  export type IRequest = {
    page?: number & tags.Minimum<1>;
    limit?: number & tags.Minimum<1> & tags.Maximum<100>;
    search?: string;
    status?: "active" | "inactive";
  };
}
```

---

## Step 1.4: Create Collector

Location: `/src/collectors/{Prefix}{Entity}Collector.ts`

```typescript
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
      name: props.body.name,
      status: props.body.status ?? "active",
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
  }
}
```

---

## Step 1.5: Create Transformer

Location: `/src/transformers/{Prefix}{Entity}Transformer.ts`

```typescript
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { {table_name} } from "@prisma/sdk";

import { toISOStringSafe } from "../utils/toISOStringSafe";

export namespace {Prefix}{Entity}Transformer {
  export function transform(record: {table_name}): I{Prefix}{Entity} {
    return {
      id: record.id,
      name: record.name,
      status: record.status,
      created_at: toISOStringSafe(record.created_at),
      updated_at: toISOStringSafe(record.updated_at),
      deleted_at: record.deleted_at
        ? toISOStringSafe(record.deleted_at)
        : null,
    };
  }

  export function toSummary(record: {table_name}): I{Prefix}{Entity}.ISummary {
    return {
      id: record.id,
      name: record.name,
      status: record.status,
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

---

## Step 1.6: Create Provider

Location: `/src/providers/post{Prefix}{Entity}.ts` (and get, patch, delete)

```typescript
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { HttpException } from "@nestjs/common";

import { MyGlobal } from "../MyGlobal";
import { {Prefix}{Entity}Collector } from "../collectors/{Prefix}{Entity}Collector";
import { {Prefix}{Entity}Transformer } from "../transformers/{Prefix}{Entity}Transformer";
import { AdminPayload } from "../decorators/payload/AdminPayload";

export async function post{Prefix}{Entity}(props: {
  admin: AdminPayload;
  body: I{Prefix}{Entity}.ICreate;
}): Promise<I{Prefix}{Entity}> {
  const data = {Prefix}{Entity}Collector.collect({ body: props.body });

  const created = await MyGlobal.prisma.{table_name}.create({
    data,
  });

  return {Prefix}{Entity}Transformer.transform(created);
}
```

---

## Step 1.7: Create Controller

Location: `/src/controllers/{prefix}/admin/{entities}/{Prefix}Admin{Entities}Controller.ts`

```typescript
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { I{Prefix}{Entity} } from "../../../../api/structures/I{Prefix}{Entity}";
import { AdminAuth } from "../../../../decorators/AdminAuth";
import { AdminPayload } from "../../../../decorators/payload/AdminPayload";
import { post{Prefix}{Entity} } from "../../../../providers/post{Prefix}{Entity}";
import { get{Prefix}{Entity} } from "../../../../providers/get{Prefix}{Entity}";

@Controller("{prefix}/admin/{entities}")
export class {Prefix}Admin{Entities}Controller {
  @TypedRoute.Post()
  @AdminAuth()
  async create(
    @AdminPayload() admin: AdminPayload,
    @TypedBody() body: I{Prefix}{Entity}.ICreate,
  ): Promise<I{Prefix}{Entity}> {
    return await post{Prefix}{Entity}({ admin, body });
  }

  @TypedRoute.Get(":entityId")
  @AdminAuth()
  async at(
    @AdminPayload() admin: AdminPayload,
    @TypedParam("entityId") entityId: string & tags.Format<"uuid">,
  ): Promise<I{Prefix}{Entity}> {
    return await get{Prefix}{Entity}({ admin, entityId });
  }

  // ... other methods
}
```

---

## Step 1.8: Verify Build

```bash
npm run build:main
```

If errors, fix them before proceeding to Phase 2.
