### ❌ Line terminator not permitted before arrow.

When you get a syntax error saying "`Line terminator not permitted before arrow.`", it means the arrow `=>` is placed at the start of a new line, which is invalid.

**Fix this by placing `=>` at the end of the previous line**, for example:

```ts
() => api.doSomething()
```

instead of

```ts
()
=> api.doSomething()
```

Alternatively, use a block body with braces:

```ts
() => {
  return api.doSomething();
}
```

### ❌ The operand of a 'delete' operator must be optional

When you get a TypeScript error like:

```
The operand of a 'delete' operator must be optional.
```

It means you're trying to use the `delete` operator on a **non-optional property**, which is not allowed in strict mode.

For example:

```ts
type User = { name: string };
const user: User = { name: "Alice" };

delete user.name; // ❌ Error: 'name' is not optional
```

#### ✅ Fix this by making the property optional:

```ts
type User = { name?: string }; // name is now optional
const user: User = { name: "Alice" };

delete user.name; // ✅ OK
```

#### ✅ Or avoid using `delete` altogether:

In most cases, **you should avoid using `delete`** in TypeScript.
Instead, explicitly set the value to `undefined`:

```ts
user.name = undefined; // ✅ Preferred in most cases
```

> 🔎 In TypeScript, `delete` is primarily intended for dynamic objects like `Record<string, any>`.
> When working with structured types (interfaces, classes), prefer marking fields as optional and assigning `undefined` instead of deleting them.
