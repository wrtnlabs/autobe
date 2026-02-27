# Phase 2: Test Design Flow

Design comprehensive test scenarios for the feature.

---

## Step 2.1: Create prepare_random Function

Location: `/test/prepare/prepare_random_{prefix}_{entity}.ts`

```typescript
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { DeepPartial } from "@ORGANIZATION/PROJECT-api/lib/typings/DeepPartial";
import { RandomGenerator } from "@nestia/e2e";
import { randint } from "tstl";
import { v4 } from "uuid";

export function prepare_random_{prefix}_{entity}(
  input?: DeepPartial<I{Prefix}{Entity}.ICreate> | undefined,
): I{Prefix}{Entity}.ICreate {
  return {
    name: input?.name ?? RandomGenerator.name(2),
    status: input?.status ?? "active",
    // Add all required fields with random generators
  };
}
```

---

## Step 2.2: Create generate_random Function

Location: `/test/generate/generate_random_{prefix}_{entity}.ts`

```typescript
import api from "@ORGANIZATION/PROJECT-api";
import { I{Prefix}{Entity} } from "@ORGANIZATION/PROJECT-api/lib/structures/I{Prefix}{Entity}";
import { DeepPartial } from "@ORGANIZATION/PROJECT-api/lib/typings/DeepPartial";

import { prepare_random_{prefix}_{entity} } from "../prepare/prepare_random_{prefix}_{entity}";

export async function generate_random_{prefix}_{entity}(
  connection: api.IConnection,
  input?: DeepPartial<I{Prefix}{Entity}.ICreate> | undefined,
): Promise<I{Prefix}{Entity}> {
  const body = prepare_random_{prefix}_{entity}(input);
  return api.functional.{prefix}.admin.{entities}.create(connection, body);
}
```

---

## Step 2.3: Design Test Scenarios

### Category 1: Happy Path Tests

```typescript
// test_api_{entity}_create_success.ts
export async function test_api_{entity}_create_success(
  connection: api.IConnection,
): Promise<void> {
  // 1. Prepare admin connection
  const admin = await authorize_admin(connection);

  // 2. Create entity
  const input = prepare_random_{prefix}_{entity}();
  const created = await api.functional.{prefix}.admin.{entities}.create(
    admin.connection,
    input,
  );

  // 3. Validate
  typia.assert(created);
  TestValidator.equals("name", created.name, input.name);
  TestValidator.equals("status", created.status, input.status ?? "active");
}

// test_api_{entity}_read_success.ts
export async function test_api_{entity}_read_success(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);
  const created = await generate_random_{prefix}_{entity}(admin.connection);

  const read = await api.functional.{prefix}.admin.{entities}.at(
    admin.connection,
    created.id,
  );

  typia.assert(read);
  TestValidator.equals("id", read.id, created.id);
}

// test_api_{entity}_update_success.ts
// test_api_{entity}_delete_success.ts
// test_api_{entity}_list_success.ts
```

### Category 2: Error Case Tests

```typescript
// test_api_{entity}_create_missing_required.ts
export async function test_api_{entity}_create_missing_required(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);

  await TestValidator.httpError("missing name", 400, async () => {
    await api.functional.{prefix}.admin.{entities}.create(
      admin.connection,
      // @ts-expect-error Testing missing required field
      { },
    );
  });
}

// test_api_{entity}_read_not_found.ts
export async function test_api_{entity}_read_not_found(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);
  const nonExistentId = v4();

  await TestValidator.httpError("not found", 404, async () => {
    await api.functional.{prefix}.admin.{entities}.at(
      admin.connection,
      nonExistentId,
    );
  });
}

// test_api_{entity}_unauthorized.ts
export async function test_api_{entity}_unauthorized(
  connection: api.IConnection,
): Promise<void> {
  const input = prepare_random_{prefix}_{entity}();

  await TestValidator.httpError("unauthorized", 401, async () => {
    await api.functional.{prefix}.admin.{entities}.create(
      connection,  // No auth token
      input,
    );
  });
}
```

### Category 3: Edge Case Tests

```typescript
// test_api_{entity}_create_empty_string.ts
export async function test_api_{entity}_create_empty_string(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);

  await TestValidator.httpError("empty name", 400, async () => {
    await api.functional.{prefix}.admin.{entities}.create(
      admin.connection,
      { name: "" },
    );
  });
}

// test_api_{entity}_create_max_length.ts
export async function test_api_{entity}_create_max_length(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);
  const longName = "a".repeat(256);  // Assuming 255 max

  await TestValidator.httpError("too long name", 400, async () => {
    await api.functional.{prefix}.admin.{entities}.create(
      admin.connection,
      { name: longName },
    );
  });
}

// test_api_{entity}_create_duplicate.ts
export async function test_api_{entity}_create_duplicate(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);
  const created = await generate_random_{prefix}_{entity}(admin.connection);

  // If name should be unique
  await TestValidator.httpError("duplicate", 409, async () => {
    await api.functional.{prefix}.admin.{entities}.create(
      admin.connection,
      { name: created.name },
    );
  });
}

// test_api_{entity}_create_invalid_parent.ts
export async function test_api_{entity}_create_invalid_parent(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);
  const nonExistentParentId = v4();

  await TestValidator.httpError("parent not found", 404, async () => {
    await api.functional.{prefix}.admin.{entities}.create(
      admin.connection,
      {
        name: RandomGenerator.name(2),
        parent_id: nonExistentParentId,
      },
    );
  });
}

// test_api_{entity}_access_deleted.ts
export async function test_api_{entity}_access_deleted(
  connection: api.IConnection,
): Promise<void> {
  const admin = await authorize_admin(connection);
  const created = await generate_random_{prefix}_{entity}(admin.connection);

  // Delete entity
  await api.functional.{prefix}.admin.{entities}.erase(
    admin.connection,
    created.id,
  );

  // Try to access deleted entity
  await TestValidator.httpError("deleted entity", 404, async () => {
    await api.functional.{prefix}.admin.{entities}.at(
      admin.connection,
      created.id,
    );
  });
}
```

---

## Step 2.4: Test File Organization

```
test/features/api/{entity}/
├── test_api_{entity}_create_success.ts
├── test_api_{entity}_read_success.ts
├── test_api_{entity}_update_success.ts
├── test_api_{entity}_delete_success.ts
├── test_api_{entity}_list_success.ts
├── test_api_{entity}_create_missing_required.ts
├── test_api_{entity}_read_not_found.ts
├── test_api_{entity}_unauthorized.ts
├── test_api_{entity}_create_empty_string.ts
├── test_api_{entity}_create_max_length.ts
├── test_api_{entity}_create_duplicate.ts
├── test_api_{entity}_create_invalid_parent.ts
└── test_api_{entity}_access_deleted.ts
```

---

## Step 2.5: Verify Test Build

```bash
npm run build:test
```

If errors, fix them before proceeding to Phase 3.
