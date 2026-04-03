# Recursive Type Supplement

The target DTO has **self-referencing properties** — for example, `ICategory.parent` is `ICategory` (N:1), or `ICategory.children` is `ICategory[]` (1:N), or both. Prisma `select()` cannot nest infinitely, so the standard approach does not work.

The provided template code already demonstrates the correct **VariadicSingleton cache pattern**. There are three possible cases. Follow the case that matches the template you received:

---

## Case 1: Parent only (N:1 self-reference)

When the DTO has a nullable/optional self-referencing property (e.g., `parent?: ICategory | null`):

- **`select()`**: FK column only (`parent_id: true`), relation explicitly `undefined`
- **`transform()`**: Takes one optional `VariadicSingleton<Promise<DTO>, [string]>` cache parameter with default `createParentCache()`. Resolves the parent via `cache.get(input.parent_id)` when FK is non-null
- **`transformAll()`**: Creates a shared parent cache and maps all items through `transform(x, cache)`
- **`createParentCache()`**: Private function that queries DB by ID with `select()` and calls `transform(record, cache)` — passing itself — to resolve recursively. `VariadicSingleton` ensures each ID is fetched exactly once

---

## Case 2: Children only (1:N self-reference)

When the DTO has an array self-referencing property (e.g., `children: ICategory[]`) but no parent property:

- **`select()`**: Relation set to `undefined`, `id: true` must be selected for children cache key
- **`transform()`**: Takes one optional `VariadicSingleton<Promise<DTO[]>, [string]>` cache parameter with default `createChildrenCache()`. Resolves children via `cache.get(input.id)`
- **`transformAll()`**: Creates a shared children cache and maps all items through `transform(x, cache)`
- **`createChildrenCache()`**: Private function that queries DB by parent FK column (`WHERE parent_id = ?` — check the actual FK column name in the schema) with `select()` and maps results through `transform(r, cache)`. `VariadicSingleton` ensures each parent's children are fetched exactly once

---

## Case 3: Both parent and children (bidirectional self-reference)

When the DTO has both a nullable self-ref (`parent?: ICategory | null`) and an array self-ref (`children: ICategory[]`):

- **`select()`**: `id: true` for children lookup, FK column for parent (`parent_id: true`), both relations set to `undefined`
- **`transform()`**: Takes two optional cache parameters — `parentCache` (`VariadicSingleton<Promise<DTO>, [string]>`) and `childrenCache` (`VariadicSingleton<Promise<DTO[]>, [string]>`), each defaulting to their respective `create*Cache()` functions
- **`transformAll()`**: Creates a **mutually-referencing pair** of caches via `let parentCache; let childrenCache; parentCache = new VariadicSingleton(...); childrenCache = new VariadicSingleton(...)` — both closures capture each other by reference so the entire tree traversal shares one deduplication scope
- **`createParentCache()`**: Standalone function for single-item transforms; internally calls `transform(record, cache)` (only parent cache shared, new children cache created per sub-traversal)
- **`createChildrenCache()`**: Standalone function for single-item transforms; calls `createParentCache()` **once per children batch** (not per record) so all siblings share one parent-deduplication scope, then calls `transform(r, parentCache, cache)` per record

### Key rule for `transformAll` in Case 3

The `transformAll` pattern with mutually-referencing `let` variables is **mandatory** for correct deduplication across the full tree:

```typescript
export async function transformAll(inputs: Payload[]): Promise<DTO[]> {
  // Use definite assignment assertions (!) so TypeScript does not flag the
  // cross-references as "used before assigned". The async callbacks only
  // execute after both variables are fully initialized.
  let parentCache!: VariadicSingleton<Promise<DTO>, [string]>;
  let childrenCache!: VariadicSingleton<Promise<DTO[]>, [string]>;
  parentCache = new VariadicSingleton(async (id) => {
    const record = await MyGlobal.prisma.table.findFirstOrThrow({ ...select(), where: { id } });
    return transform(record, parentCache, childrenCache);
  });
  childrenCache = new VariadicSingleton(async (parentId) => {
    const records = await MyGlobal.prisma.table.findMany({ ...select(), where: { parent_id: parentId } });
    return await ArrayUtil.asyncMap(records, (r) => transform(r, parentCache, childrenCache));
  });
  return await ArrayUtil.asyncMap(inputs, (x) => transform(x, parentCache, childrenCache));
}
```

JavaScript closures capture variables by reference, so both `VariadicSingleton` callbacks see the fully-assigned pair even though the assignments appear sequentially. The `!` assertion is essential — without it TypeScript raises TS2454 ("used before assigned") on `childrenCache` inside the first closure.
