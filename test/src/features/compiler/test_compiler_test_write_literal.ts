import { AutoBeTest } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { prepare_compiler_test } from "./internal/prepare_compiler_test";

export const test_compiler_test_write_literal = async (): Promise<void> => {
  const { compiler, document, scenario } = await prepare_compiler_test();
  const expressions: AutoBeTest.IExpression[] = [
    {
      type: "binaryExpression",
      operator: "!==",
      left: {
        type: "numericLiteral",
        value: 3,
      },
      right: {
        type: "numericLiteral",
        value: 4,
      },
    },
    {
      type: "booleanLiteral",
      value: false,
    },
    {
      type: "numericLiteral",
      value: 42,
    },
    {
      type: "stringLiteral",
      value: "Hello, World!",
    },
    {
      type: "nullLiteral",
      value: null,
    },
    {
      type: "undefinedKeyword",
      value: undefined,
    },
    {
      type: "arrayLiteralExpression",
      elements: [1, 2, 3, 4].map((value) => ({
        type: "numericLiteral",
        value,
      })),
    },
    {
      type: "objectLiteralExpression",
      properties: [
        {
          type: "propertyAssignment",
          name: "key1",
          value: {
            type: "stringLiteral",
            value: "value1",
          },
        },
        {
          type: "propertyAssignment",
          name: "a-b-c-d",
          value: {
            type: "numericLiteral",
            value: 100,
          },
        },
      ],
    },
  ];
  const result: string = await compiler.write({
    document,
    scenario,
    function: {
      plan: "",
      draft: "",
      statements: [
        ...expressions.map(
          (e) =>
            ({
              type: "expressionStatement",
              expression: e,
            }) satisfies AutoBeTest.IExpressionStatement,
        ),
      ],
    },
  });
  TestValidator.predicate("binary")(() => result.includes("3 !== 4"));
  TestValidator.predicate("boolean")(() => result.includes("false"));
  TestValidator.predicate("numeric")(() => result.includes("42"));
  TestValidator.predicate("string")(() => result.includes(`"Hello, World!"`));
  TestValidator.predicate("null")(() => result.includes("null"));
  TestValidator.predicate("undefined")(() => result.includes("undefined"));
  TestValidator.predicate("array")(() => result.includes("["));
  TestValidator.predicate("object")(
    () => result.includes("key1:") && result.includes(`"a-b-c-d":`),
  );
};
