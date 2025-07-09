# AI Function Calling Common Mistakes Guide

## 1. Expression instead of Statement

AI function calling often puts `AutoBeTest.IExpression` typed data directly into `AutoBeTest.IFunction.statements` or `AutoBeTest.IBlock.statements` arrays, but these arrays only accept `AutoBeTest.IStatement` types.

Wrap the `AutoBeTest.IExpression` typed value into `AutoBeTest.IExpressionStatement`.

```json
// VALIDATION ERROR
{
  "path": "$input.function.statements[0]",
  "value": "{{ some AutoBeTest.IExpression typed data }}",
  "expected": "${{AutoBeTest.IStatement}}"
}

// FIX LIKE BELOW
{
  "type": "expressionStatement",
  "expression": "{{ some AutoBeTest.IExpression typed data }}"
}
```

## 2. Literal Value instead of Literal Expression

AI function calling often uses raw literal values like `false`, `3` and `"text"` where `AutoBeTest.IExpression` is expected. Use the corresponding literal expression types instead.

```json
// VALIDATION ERROR
{
  "path": "$input.function.statements[0].argument.body.age",
  "value": 20,
  "expected": "${{AutoBeTest.IExpression}}"
}

// FIX LIKE BELOW
{
  "type": "numericLiteral",
  "value": 20
}
```