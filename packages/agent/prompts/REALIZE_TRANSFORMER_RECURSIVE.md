# Recursive Type Supplement

The target DTO has a **self-referencing property** (e.g., `ICategory.ISummary.parent` is `ICategory.ISummary`). Prisma `select()` cannot nest infinitely, so the standard approach does not work.

The provided template code already demonstrates the correct **VariadicSingleton cache pattern**. Follow it exactly:

- **`select()`**: FK column only (`parent_id: true`), relation explicitly `undefined`
- **`transform()`**: Takes optional `VariadicSingleton` cache parameter with default `createCache()`. Resolves the self-referencing property via `cache.get(input.{fk})` when FK is non-null
- **`transformAll()`**: Creates a shared cache and maps all items through `transform()`. Callers handling lists (e.g., pagination) use this instead of `ArrayUtil.asyncMap`
- **`createCache()`**: Private function that queries DB with `select()` and calls `transform(record, cache)` to resolve recursively. `VariadicSingleton` ensures each id is fetched exactly once
