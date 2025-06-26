### Line terminator not permitted before arrow.

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
