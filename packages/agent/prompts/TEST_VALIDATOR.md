# ✅ `TestValidator`

You are given access to the `TestValidator` utility, which provides functional testing helpers. It includes assertion helpers (`equals`, `predicate`) and error expectation helpers (`error`, `httpError`). All methods use **currying**, meaning you must call them **step-by-step** in sequence.

The following are the core functions you may use, along with exact signatures and usage rules:

---

## 🔹 `TestValidator.equals(title)(expected)(actual)`

* **Purpose**: Validates that `expected` and `actual` values are deeply equal.
* **Currying steps**:

  1. `title: string` — description shown when the comparison fails.
  2. `expected: T` — the baseline value. Must be the same type or **wider** than `actual`.
  3. `actual: T` — the value to compare with.
* **Returns**: `void`
* **Exception**: Throws an error if `expected` and `actual` differ.
* **Optional**: You can provide a second argument to `equals(title, exception)` to skip certain keys during comparison.

```ts
TestValidator.equals("Article must match")(expectedArticle)(receivedArticle);
```

❗ **Important: Expected value must be wider or equal in type.**

```ts
// ✅ Correct: actual ("md") is assignable to expected ("md" | "html")
TestValidator.equals("Format check")(updatedSnapshot.format as "md" | "html")("md" as "md");

// ❌ Incorrect: "md" is not assignable to "md" | "html" → compile-time error
TestValidator.equals("Format check")("md" as "md")(updatedSnapshot.format as "md" | "html");
```

This type direction ensures TypeScript can validate structural compatibility statically.

❗ **Important: Please do not use it to check for the void type.**

```ts
TestValidator.equals("health check API는 void 반환")(undefined)(output) // Invalid!
```

You cannot validate the `void` type directly. If you want to compare a function's return type that is `void`, use the following pattern:

```ts
TestValidator.equals("This type should be void")(typia.is<void>(target))(true); // Good!
```


---

## 🔹 `TestValidator.predicate(title)(condition)`

* **Purpose**: Validates that a boolean condition is true.
* **Currying steps**:

  1. `title: string` — message used when the condition fails.
  2. `condition: boolean | () => boolean | () => Promise<boolean>` — condition to evaluate.
* **Returns**:

  * `void` if the condition is synchronous
  * `Promise<void>` if the condition is asynchronous
* **Exception**: Throws an error with the `title` if the condition is false.

```ts
TestValidator.predicate("User must be active")(() => user.status === "active");
```

To resolve errors like:

```error
Type '{ page: number; limit: number; sort: string[]; }' is not assignable to type 'IRequest'.
```

it is recommended to use `TestValidator.predicate`.

You can provide a function that returns a boolean value, such as:

```ts
TestValidator.predicate("description of what you're testing")(() => {
    return typia.is<Type>(targetObj);
});
```

This approach allows you to validate whether the object conforms to the expected type without causing assignment errors.


---

## 🔹 `TestValidator.error(title)(task)`

* **Purpose**: Validates that the given task throws an error.
* **Currying steps**:

  1. `title: string` — message shown when no error is thrown.
  2. `task: () => any | Promise<any>` — function that is expected to throw.
* **Returns**:

  * `void` or `Promise<void>`
* **Exception**: Throws an error if the task completes **without** throwing.

```ts
TestValidator.error("Expected login to fail")(() => login(invalidCredentials));
```

---

## 🔹 `TestValidator.httpError(title)(...statuses)(task)`

* **Purpose**: Validates that the given task throws an HTTP error with one of the specified status codes.
* **Currying steps**:

  1. `title: string` — message shown when no HTTP error or unexpected status occurs.
  2. `...statuses: number[]` — acceptable HTTP error codes.
  3. `task: () => any | Promise<any>` — function that is expected to fail.
* **Returns**:

  * `void` or `Promise<void>`
* **Exception**: Throws if no error is thrown, or if the status code does not match any in `statuses`.

```ts
TestValidator.httpError("Should return 403")(403)(() => accessAdminPage(user));
```

---

# ⚠️ Currying is Required

Each method uses **currying** — do **not** invoke with all parameters at once. You **must** call each method step by step (e.g., `f(x)(y)(z)`), not as `f(x, y, z)`.

---

# ⚠️ Type Direction Matters in `equals`

The type of `expected` must be **wider or equal** to the type of `actual`. This allows TypeScript to validate that the actual result conforms to what is expected. Reversing this order may cause a compile-time type error.

```ts
// ✅ Correct: expected is wider ("md" | "html"), actual is narrower ("md")
TestValidator.equals("Format check")(updatedSnapshot.format as "md" | "html")("md" as "md");

// ✅ Correct: expected is wider or equal type when comparing snapshots
const latest = reloaded.snapshots.at(-1);
if (!latest) throw new Error("No snapshots found");
TestValidator.equals("Latest snapshot match")(latest)(updatedSnapshot);

// ❌ Incorrect: expected is narrower ("md"), actual is wider ("md" | "html") → type error
TestValidator.equals("Format check")("md" as "md")(updatedSnapshot.format as "md" | "html");

// ❌ Incorrect: swapped snapshot order may cause type error
TestValidator.equals("Latest snapshot match")(updatedSnapshot)(reloaded.snapshots.at(-1));
```

---

# 🧠 Purpose

Use `TestValidator` in automated tests to assert:

* equality (`equals`)
* correctness of booleans (`predicate`)
* expected failure cases (`error`, `httpError`)

---

# 🧪 Example

```ts
TestValidator.equals("Returned user must match")(expectedUser)(receivedUser);
TestValidator.predicate("User must be admin")(() => user.role === "admin");
await TestValidator.error("Creating with invalid data should fail")(() => createUser(invalidData));
await TestValidator.httpError("Forbidden access")(403, 401)(() => accessSecret(user));
```

# ⚠️ Be Careful with Empty Array Literals and Type Inference in `equals`

When using `TestValidator.equals`, be cautious with implicit type inference — especially with empty literals like `[]` or `null`.

## 🔸 Problem: `[]` becomes `never[]`

If you pass an empty array literal (`[]`) directly as the `expected` value, TypeScript will infer its type as `never[]`, which is unlikely to match the actual data type.

```ts
// ❌ Incorrect: `[]` is inferred as `never[]`, causing a type mismatch
TestValidator.equals("Result data should be empty")([])(result.data); // type error
```

## ✅ Recommended: Declare types explicitly with variables

Instead of passing literals directly, declare variables with explicit types to guide TypeScript's inference:

```ts
// ✅ Correct: declare expected with the proper type
const expected: ISummary[] = [];
const actual: ISummary[] = result.data;
TestValidator.equals("Result data should be empty")(expected)(actual);
```

This helps ensure type compatibility and avoids hidden inference issues like `never[]`.

---

## 🔸 Problem: Union types like `Type | null`

Another common mistake is passing a value with a union type (e.g., `Type | null`) as `expected`, while `actual` has a narrower type (e.g., just `Type`). This can lead to errors like:

```
Argument of type '(string & Format<"uuid">) | null' is not assignable to parameter of type 'null'.
```

## ✅ Recommended: Align types exactly

Use explicit variable declarations with exact types to prevent such mismatches:

```ts
// ✅ Correct: Align both types exactly
const expected: string & Format<"uuid"> | null = generatedUuid;
const actual: string & Format<"uuid"> = response.id;
TestValidator.equals("UUIDs must match")(expected)(actual);
```

This practice helps catch type errors early and ensures that the validator works as intended with strict type checking.


# ⚠️ Prefer Property-Level Comparison for Complex Objects

When using `TestValidator.equals` to compare objects (especially arrays of objects), it's easy to run into subtle type mismatches or unintentional structural differences — such as missing optional fields, different property orders, or union type overlaps.

```ts
// ❌ Risky: Full object comparison may fail due to minor type differences
TestValidator.equals("File list updated")([
  { name: "doc", extension: "pdf", url: "https://files.example.com/doc.pdf" },
])(updatedSnapshot.files);
```

Even if the runtime values look the same, TypeScript may infer slightly different types for literals vs. actual data, which can lead to confusing type errors.

---

## ✅ Recommended: Compare individual properties explicitly

To avoid fragile deep comparisons, prefer comparing each property separately:

```ts
const file = updatedSnapshot.files[0];
TestValidator.equals("File name should be 'doc'")("doc")(file.name);
TestValidator.equals("File extension should be 'pdf'")("pdf")(file.extension);
TestValidator.equals("File URL should match")("https://files.example.com/doc.pdf")(file.url);
```

This approach gives:

* Clearer failure messages
* More precise type checking
* Easier debugging when only part of the object is incorrect

Use full-object comparison only when the types are tightly controlled and guaranteed to match exactly.

