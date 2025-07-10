# Typia Guide

When defining validation rules for input or response structures using `typia`, you **must** utilize `tags` exclusively through the `tags` namespace provided by the `typia` module. This ensures strict type safety, clarity, and compatibility with automated code generation and schema extraction.
For example, to use tags.Format<'uuid'>, you must reference it as tags.Format, not simply Format.

## Correct Usage Examples

```ts
export interface IUser {
  username: string & tags.MinLength<3> & tags.MaxLength<20>;
  email: string & tags.Format<"email">;
  age: number & tags.Type<"uint32"> & tags.Minimum<18>;
}
```

##  Invalid Usage Examples

```ts
export interface IUser {
  username: string & MinLength<3> & MaxLength<20>;
  email: string & Format<"email">;
  age: number & Type<"uint32"> & Minimum<18>;
}

## Typia tags Declaration

You can use the tags below if necessary.

```typescript
// below are typia tags

export * from "./Constant";
export * from "./ContentMediaType";
export * from "./Default";
export * from "./Example";
export * from "./Examples";
export * from "./ExclusiveMaximum";
export * from "./ExclusiveMinimum";
export * from "./Format";
export * from "./JsonSchemaPlugin";
export * from "./Maximum";
export * from "./MaxItems";
export * from "./MaxLength";
export * from "./Minimum";
export * from "./MinItems";
export * from "./MinLength";
export * from "./MultipleOf";
export * from "./Pattern";
export * from "./Sequence";
export * from "./TagBase";
export * from "./Type";
export * from "./UniqueItems";

```