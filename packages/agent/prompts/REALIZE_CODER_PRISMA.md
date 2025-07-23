# Prisma Guide

## 🔍 Prisma Update Input Type Safety Guide

When implementing an update operation using `Prisma.update()`, you **must strictly follow these rules** to avoid `TS2322` or structural type errors.

This section guides you through **a checklist**, provides **clear rationale**, and includes **copyable safe patterns** for high accuracy and minimal confusion — for both human developers and LLMs.

---

### ✅ Why Type Errors Occur

TypeScript error `TS2322` usually occurs because:

1. You **manually defined** an object type for `data` instead of using the Prisma-generated input type.
2. You **assigned `null`** to a field that is not nullable in the Prisma schema.
3. You **used DTO types** (e.g., `IBbsUserRoles`) instead of the Prisma model update type.
4. You **assigned values to optional fields** without checking ownership or value type.
5. You **used dynamic imports** (e.g., `import("@prisma/client")`) that bypass proper static typing.

---

### ✅ Step-by-Step Checklist Before You Call `update()`

#### ✅ 1. Always use Prisma's update input type

**DO:**

```ts
import { Prisma } from "@prisma/client";

const data: Prisma.User_rolesUpdateInput = {};
```

**DON'T:**

```ts
const data: { name?: string | null } = {}; // ❌ will not match Prisma's input type
```

---

#### ✅ 2. Use `?? undefined` to cleanly normalize nullable/optional inputs

If a field is `nullable`, use:

```ts
data.description = body.description ?? undefined;
```

If a field is **required** but **not provided**, **omit** it — do not assign `null`.

---

#### ✅ 3. Use `hasOwnProperty` to detect explicit field presence

```ts
if (Object.prototype.hasOwnProperty.call(body, "name")) {
  data.name = body.name ?? undefined;
}
```

> ⚠️ This is essential to distinguish between:
>
> * `{ name: undefined }` (intentional update)
> * `{}` (field not provided at all)

---

#### ✅ 4. Never use DTO types (`IBbs...`) for `data`

DTO types are for API input/output, **not internal DB operations**. Prisma input types (like `Prisma.User_rolesUpdateInput`) should always be used for database writes.

---

#### ✅ 5. Use TypeScript’s narrowing, never bypass with `as`

Never try:

```ts
const data = {...} as any; // ❌ extremely dangerous
```

Only acceptable `as` use:

```ts
const uuid = v4() as string & tags.Format<'uuid'>;
```

---

#### ✅ 6. Never use dynamic import for Prisma types

Dynamic imports like `import("@prisma/client")`:

```ts
const { Prisma } = await import("@prisma/client"); // ❌ Do not use
```

should **never** be used for type access. This **bypasses static type checking** and **breaks tooling support**. Always use static imports:

```ts
import { Prisma } from "@prisma/client"; // ✅ Safe and typed
```

---

### 💡 Copyable Safe Pattern

```ts
import { Prisma } from "@prisma/client";

const data: Prisma.User_rolesUpdateInput = {};
if ("name" in body) data.name = body.name ?? undefined;
if ("description" in body) data.description = body.description ?? undefined;
```

---

### ❌ Common Pitfalls and Fixes

| ❌ Bad Practice                             | ✅ Fix                                   |
| ------------------------------------------ | --------------------------------------- |
| Manually define `data` as inline object    | Use `Prisma.ModelUpdateInput`           |
| Assign `null` to non-nullable fields       | Use `?? undefined` or omit              |
| Use DTOs like `IBbsUserRoles` for update   | Only use DTOs for API input/output      |
| Assign `data = body` directly              | Extract and normalize fields explicitly |
| Use `import("@prisma/client")` dynamically | Use static `import { Prisma } ...`      |

---

### ✅ Rule of Thumb

> **If you're passing `data` into Prisma, it must be type-compatible with `Prisma.ModelUpdateInput` — and must be built using statically imported types. No exceptions.**

---

### 📎 TL;DR for Agent or Developer

1. Always use `Prisma.ModelUpdateInput` as the type.
2. Use `?? undefined` to normalize input.
3. Use `hasOwnProperty` to detect intent.
4. Don’t use `null` unless the schema allows it.
5. Never use DTO types for `data`.
6. **Never use `import("@prisma/client")` dynamically — always use static import.**
