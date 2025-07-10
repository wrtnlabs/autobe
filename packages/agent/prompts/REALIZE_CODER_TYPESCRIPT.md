# 🛠 TypeScript Error Fix Guide

This document explains how to fix common TypeScript compiler errors when writing provider logic.

---

## 🔧 Common Type Fix Patterns

### 🔹 Union Types (e.g., `number | (number & tags.Type<"int32">)`)

**Problem**: Schema expects a branded number but union appears due to optional or partial input.

✅ **Fix**:

```ts
const value = body.value ?? 0;
```

Then use:

```ts
const input = {
  value,
} satisfies SomeSchemaInput;
```

---

### 🔹 Literal Union Types (e.g., `1 | -1`)

**Problem**: Prisma schema expects a literal value, but `number` is passed.

✅ **Fix Options**:

1. Manual coercion:

```ts
const value = body.value === 1 ? 1 : -1;
```

2. Safe `as` (allowed only for literal unions):

```ts
const input = {
  value: body.value as 1 | -1,
};
```

3. Using `typia.assertGuard`:

```ts
const value = typia.assertGuard<1 | -1>(body.value);
```

---

### 🔹 `Object literal may only specify known properties`

**Problem**: You’re passing fields that do not exist in Prisma input types (e.g., `user_id`).

✅ **Fix**: Remove or remap fields according to schema.

```ts
const { user_id, ...rest } = body;

const input = {
  ...rest,
  user: { connect: { id: user_id } },
} satisfies Prisma.postsCreateInput;
```

---

### 🔹 `Cannot find module` (e.g., `bcrypt`)

**Problem**: Missing dependency or type declaration.

✅ **Fix**:

```sh
npm install bcrypt
npm install --save-dev @types/bcrypt
```

---

### 🔹 Branded Type Assignability

**Problem**: `string | (string & Format<'uuid'>)` is not assignable to `string & Format<'uuid'>`

✅ **Fix**:
Use either a validated cast or `typia.assertGuard`:

```ts
const id = body.id as string & tags.Format<'uuid'>; // Allowed exception
```

OR:

```ts
const id = typia.assertGuard<string & tags.Format<'uuid'>>(body.id);
```

---

### ✅ Summary Table

| Error Type                               | Solution                                        |                          |
| ---------------------------------------- | ----------------------------------------------- | ------------------------ |
| Branded union (e.g. \`number             | number & Type<"int32">\`)                       | Use `??` and `satisfies` |
| `1 \| -1` literal union                  | Constrain manually or use `as` safely           |                          |
| `unknown property` in object             | Restructure input object to match schema        |                          |
| `as` usage                               | Only allowed for brand/literal/validated values |                          |
| Missing module (e.g. bcrypt)             | Install and import properly                     |                          |
| Cannot use MyGlobal.user / requestUserId | Always use the `user` function argument         |                          |

