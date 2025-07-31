# Prisma Schemas

```json
{prisma_schemas}
````

# ℹ️ How to Use the Above Prisma Schemas

These Prisma schemas are extracted directly from your actual `schema.prisma` file.

✅ **You must always consult this schema before writing any Prisma function** such as `create`, `update`, `select`, `delete`, or `where`. Do **not** rely on assumptions — every field must be verified.

### 🔍 When reviewing the schema, check:

1. **Does the field exist?**
2. **Is it a scalar field or a relation field?**
3. **Is it required, optional, or nullable?**
4. **Can this field be updated directly, or must it be accessed via `connect`, `disconnect`, or `set`?**
5. **Does the model include soft-delete fields like `deleted_at`?**

> You must check the schema to determine whether fields such as `deleted_at`, `actor_id`, or `user_id` are actually present.
> Never assume a field exists or is accessible directly.

### ⚠️ Common Prisma Mistakes (Avoid These!)

* ❌ Referencing fields that do not exist (→ causes `TS2339`, `TS2353`)
* ❌ Using foreign keys like `user_id` directly instead of:

  ```ts
  user: { connect: { id: "..." } }
  ```
* ❌ Passing `Date` directly into a field that expects a string (→ causes `TS2322`)

  ```ts
  new Date().toISOString() // ✅ use this
  ```
* ❌ Selecting or updating fields that are derived or virtual (Prisma types exclude them)
* ❌ Using fields in `updateInput` that only exist in `createInput`, or vice versa

### ✅ Rule of Thumb

> **If you get a TypeScript error like `TS2339`, `TS2353`, `TS2322`, or `TS2352`, check your schema first.**
> Most of the time, you're either referencing a non-existent field or using the wrong type or structure.

---

# Function Props Structure

The following shows the expected props structure for this function:

```typescript
{input}
```

**IMPORTANT**: The provider function you will implement must:
- **If props are defined above**: Accept a **single object parameter** that matches this props structure **exactly**
- **If no props are shown above**: Accept **no parameters** at all
- The parameter type must be **identical** to what is shown above - no additions, no modifications
- This is a mapped type containing only the fields that are actually needed for this specific endpoint

The props structure is carefully constructed based on:
- Authentication requirements (role-specific fields like admin, user, member)
- URL path parameters (e.g., id, boardId, postId)
- Request body (if applicable)

Your function signature must match one of these patterns:
```typescript
// If props are defined above
export async function your_function_name(
  props: { /* exactly as shown above */ }
): Promise<ReturnType> {
  // Implementation
}

// If no props are shown above (empty)
export async function your_function_name(): Promise<ReturnType> {
  // Implementation - no props parameter
}
```

---

# SDK

The following is the SDK for the API. Based on the information provided by this SDK, you must write code that maps the SDK-provided parameters directly into the `parameters` and `body` properties of the provider function response.

* If there are no parameters, define `parameters` as `Record<string, never>`.
* If there is no body, define `body` as `Record<string, never>`.
* **Every function must be implemented to accept both `parameters` and `body`, without exception.**
* If any required type information is referenced in the SDK, refer to the definitions in the DTO section.

```json
{artifacts_sdk}
```

---

# DTO

When importing DTOs, you must **always** use this path structure:

```ts
import { Something } from '../api/structures/Something';
```

* ✅ Use `../api/structures/...`
* ❌ Never use `../../structures/...` — these paths will not resolve
* If a type like `string & Format<"date-time">` is required, ensure you convert `Date` to a valid ISO string

```json
{artifacts_dto}
```
