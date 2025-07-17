# Typia Guide

When defining validation rules for input or response structures using `typia`, you **must** utilize `tags` exclusively through the `tags` namespace provided by the `typia` module. This ensures strict type safety, clarity, and compatibility with automated code generation and schema extraction.
For example, to use `tags.Format<'uuid'>`, you must reference it as `tags.Format`, not simply `Format`.

## ✅ Correct Usage Examples

```ts
export interface IUser {
  username: string & tags.MinLength<3> & tags.MaxLength<20>;
  email: string & tags.Format<"email">;
  age: number & tags.Type<"uint32"> & tags.Minimum<18>;
}
```

## ❌ Invalid Usage Examples

```ts
export interface IUser {
  username: string & MinLength<3> & MaxLength<20>;
  email: string & Format<"email">;
  age: number & Type<"uint32"> & Minimum<18>;
}
```

---

## 🛡️ `typia.assert` vs `typia.assertGuard`

`typia` provides two main runtime validation utilities: `assert` and `assertGuard`.
Both serve to validate runtime data against a TypeScript type, but their **behavior and return types differ**, which can influence which one to use depending on your use case.

### 🔍 `typia.assert<T>(input): T`

* Validates that `input` conforms to type `T`.
* If invalid, throws a detailed exception.
* **Returns** the parsed and validated input as type `T`.
* Ideal when you want **to validate and use the result immediately**.

**Example:**

```ts
const user = typia.assert<IUser>(input); // user is of type IUser
```

---

### 🧪 `typia.assertGuard<T>(input): void`

* Validates that `input` conforms to type `T`.
* If invalid, throws an exception like `assert`.
* **Does not return anything** (`void` return type).
* Acts like a **type guard** for the input **within the scope**.
* Useful when you want to narrow the type **for subsequent logic**, but **don't need to reassign the value**.

**Example:**

```ts
typia.assertGuard<IUser>(input); // input is now treated as IUser

// input can be used safely as IUser here
console.log(input.username);
```

### 📎 Appendix – `assert` vs `assertGuard`

```ts
/**
 * Asserts a value type.
 *
 * Asserts a parametric value type and throws a {@link TypeGuardError} with detailed
 * reason, if the parametric value is not following the type `T`. Otherwise, the
 * value is following the type `T`, just input parameter would be returned.
 *
 * If what you want is not asserting but just knowing whether the parametric value is
 * following the type `T` or not, you can choose the {@link is} function instead.
 * Otherwise you want to know all the errors, {@link validate} is the way to go.
 * Also, if you want to automatically cast the parametric value to the type `T`
 * when no problem (perform the assertion guard of type).
 *
 * On the other and, if you don't want to allow any superfluous property that is not
 * enrolled to the type `T`, you can use {@link assertEquals} function instead.
 *
 * @template T Type of the input value
 * @param input A value to be asserted
 * @param errorFactory Custom error factory. Default is `TypeGuardError`
 * @returns Parametric input value
 * @throws A {@link TypeGuardError} instance with detailed reason
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export declare function assert<T>(input: T, errorFactory?: undefined | ((props: TypeGuardError.IProps) => Error)): T;
/**
 * Asserts a value type.
 *
 * Asserts a parametric value type and throws a {@link TypeGuardError} with detailed
 * reason, if the parametric value is not following the type `T`. Otherwise, the
 * value is following the type `T`, just input parameter would be returned.
 *
 * If what you want is not asserting but just knowing whether the parametric value is
 * following the type `T` or not, you can choose the {@link is} function instead.
 * Otherwise, you want to know all the errors, {@link validate} is the way to go.
 *
 * On the other and, if you don't want to allow any superfluous property that is not
 * enrolled to the type `T`, you can use {@link assertEquals} function instead.
 *
 * @template T Type of the input value
 * @param input A value to be asserted
 * @param errorFactory Custom error factory. Default is `TypeGuardError`
 * @returns Parametric input value casted as `T`
 * @throws A {@link TypeGuardError} instance with detailed reason
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export declare function assert<T>(input: unknown, errorFactory?: undefined | ((props: TypeGuardError.IProps) => Error)): T;
/**
 * Assertion guard of a value type.
 *
 * Asserts a parametric value type and throws a {@link TypeGuardError} with detailed
 * reason, if the parametric value is not following the type `T`. Otherwise, the
 * value is following the type `T`, nothing would be returned, but the input value
 * would be automatically casted to the type `T`. This is the concept of
 * "Assertion Guard" of a value type.
 *
 * If what you want is not asserting but just knowing whether the parametric value is
 * following the type `T` or not, you can choose the {@link is} function instead.
 * Otherwise you want to know all the errors, {@link validate} is the way to go.
 * Also, if you want to returns the parametric value when no problem, you can use
 * {@link assert} function instead.
 *
 * On the other and, if you don't want to allow any superfluous property that is not
 * enrolled to the type `T`, you can use {@link assertGuardEquals} function instead.
 *
 * @template T Type of the input value
 * @param input A value to be asserted
 * @param errorFactory Custom error factory. Default is `TypeGuardError`
 * @throws A {@link TypeGuardError} instance with detailed reason
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export declare function assertGuard<T>(input: T, errorFactory?: undefined | ((props: TypeGuardError.IProps) => Error)): asserts input is T;
/**
 * Assertion guard of a value type.
 *
 * Asserts a parametric value type and throws a {@link TypeGuardError} with detailed
 * reason, if the parametric value is not following the type `T`. Otherwise, the
 * value is following the type `T`, nothing would be returned, but the input value
 * would be automatically casted to the type `T`. This is the concept of
 * "Assertion Guard" of a value type.
 *
 * If what you want is not asserting but just knowing whether the parametric value is
 * following the type `T` or not, you can choose the {@link is} function instead.
 * Otherwise you want to know all the errors, {@link validate} is the way to go.
 * Also, if you want to returns the parametric value when no problem, you can use
 * {@link assert} function instead.
 *
 * On the other and, if you don't want to allow any superfluous property that is not
 * enrolled to the type `T`, you can use {@link assertGuardEquals} function instead.
 *
 * @template T Type of the input value
 * @param input A value to be asserted
 * @param errorFactory Custom error factory. Default is `TypeGuardError`
 * @throws A {@link TypeGuardError} instance with detailed reason
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export declare function assertGuard<T>(input: unknown, errorFactory?: undefined | ((props: TypeGuardError.IProps) => Error)): asserts input is T;

```

### Handling Typia Assertion Errors for JsonSchemaPlugin Format Mismatches

- These errors occur because a value typed as `number & Type<"int32">` is being assigned where `number & Type<"int32"> & typia.tags.JsonSchemaPlugin<{ format: "uint32" }>` is expected.
- The root cause is a mismatch between signed (`int32`) and unsigned (`uint32`) integer formats.
- To resolve these, use **typia.tags.assert** to explicitly assert or validate the value conforms to the expected `uint32` format.
- Example:

```ts
const value = getValue(); // type: number & tags.Type<"int32">

tags.assert<number & tags.Type<"int32"> & tags.JsonSchemaPlugin<{ format: "uint32" }>>(value);

// Now `value` is guaranteed to conform to the expected unsigned 32-bit integer type.
```

* Always use typia.tags’ `assert` or related functions for runtime validation and to satisfy TypeScript’s type checker.
* This approach ensures type safety without compromising runtime correctness.

---

### ✅ Summary: Which Should I Use?

| Use Case                             | Recommended API          |
| ------------------------------------ | ------------------------ |
| Validate and return typed value      | `typia.assert<T>()`      |
| Narrow type without reassigning      | `typia.assertGuard<T>()` |
| Use validated object directly        | `typia.assert<T>()`      |
| Use input inside a conditional block | `typia.assertGuard<T>()` |

> **Note:** Since `assertGuard` returns `void`, if you need **both type narrowing and a returned value**, `assert` is the better choice.

---

## 🏷️ Typia Tags Declaration – Explanation & Usage Guide

You can use the following tags from Typia to annotate your types for additional semantic meaning, validation constraints, or schema generation.

| Tag                | Purpose                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Constant`         | Enforces the value to be a specific constant. Useful for literal values.<br>→ `string & tags.Constant<'active'>`                                                                |
| `ContentMediaType` | Specifies the media type of content (e.g., `application/json`, `text/plain`).                                                                                                   |
| `Default`          | Declares a default value to be used when the field is not provided.<br>**Note:** This is a schema-level hint, not runtime logic.                                                |
| `Example`          | Declares a single example value to help with documentation tools like Swagger.                                                                                                  |
| `Examples`         | Declares multiple example values.                                                                                                                                               |
| `ExclusiveMaximum` | Similar to `Maximum`, but the value must be **strictly less than** the given limit.                                                                                             |
| `ExclusiveMinimum` | Similar to `Minimum`, but the value must be **strictly greater than** the given limit.                                                                                          |
| `Format`           | Specifies a semantic format for a value, such as:<br>→ `email`, `uuid`, `date-time`, `url`, etc.<br>✅ Used heavily across our codebase.<br>e.g., `string & tags.Format<'uuid'>` |
| `JsonSchemaPlugin` | Allows adding plugin-specific schema behaviors. Rarely needed.                                                                                                                  |
| `Maximum`          | Specifies the maximum value (inclusive) for a number.<br>e.g., `number & tags.Maximum<100>`                                                                                     |
| `MaxItems`         | Specifies the maximum number of elements in an array.                                                                                                                           |
| `MaxLength`        | Specifies the maximum string length.<br>e.g., `string & tags.MaxLength<50>`                                                                                                     |
| `Minimum`          | Specifies the minimum value (inclusive) for a number.                                                                                                                           |
| `MinItems`         | Specifies the minimum number of array items.                                                                                                                                    |
| `MinLength`        | Specifies the minimum string length.                                                                                                                                            |
| `MultipleOf`       | The value must be a multiple of the given number.<br>e.g., `number & tags.MultipleOf<5>`                                                                                        |
| `Pattern`          | Applies a regular expression pattern to a string.<br>e.g., `string & tags.Pattern<'^[a-z]+$'>`                                                                                  |
| `Sequence`         | Used for sequential fields like auto-incrementing IDs.                                                                                                                          |
| `TagBase`          | Internal utility tag – typically not used directly.                                                                                                                             |
| `Type`             | Used to enforce a type name in JSON Schema generation.                                                                                                                          |
| `UniqueItems`      | Ensures all elements in an array are unique.                                                                                                                                    |

---

### ✅ Examples

```ts
type UserId = string & tags.Format<'uuid'>;
type LimitedString = string & tags.MinLength<5> & tags.MaxLength<20>;
type SmallNumber = number & tags.Minimum<1> & tags.Maximum<10>;
type ConstantStatus = string & tags.Constant<'active'>;
type Email = string & tags.Format<'email'>;
```

---

### 🔒 Typia Tag Usage Notes

* Tags are used at the **type level**, not runtime.
* They are especially useful when:

  * Generating OpenAPI / Swagger schemas
  * Enforcing validation contracts across API boundaries
  * Using `typia.assert`, `typia.validate`, or `typia.random`

> ⚠️ **Never use these tags directly for logic branching in code.** They are strictly for static type and schema purposes.

