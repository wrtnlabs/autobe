import { AutoBeTest } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestFactory } from "../../TestFactory";
import { prepare_compiler_test } from "./internal/prepare_compiler_test";

export const test_compiler_test_write_accessor = async (
  factory: TestFactory,
): Promise<void> => {
  const { compiler, document, scenario } = await prepare_compiler_test(factory);
  const expressions: AutoBeTest.IExpression[] = [
    {
      type: "identifier",
      text: "something",
    },
    {
      type: "propertyAccessExpression",
      expression: {
        type: "propertyAccessExpression",
        expression: {
          type: "identifier",
          text: "a",
        },
        questionDot: false,
        name: "b",
      },
      questionDot: true,
      name: "c",
    },
    {
      type: "elementAccessExpression",
      expression: {
        type: "elementAccessExpression",
        expression: {
          type: "identifier",
          text: "a",
        },
        questionDot: false,
        argumentExpression: {
          type: "numericLiteral",
          value: 0,
        },
      },
      questionDot: true,
      argumentExpression: {
        type: "stringLiteral",
        value: "x-y-z",
      },
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
    prettier: false,
  });
  TestValidator.predicate("identifier", () => result.includes("something"));
  TestValidator.predicate("property", () => result.includes("a.b?.c"));
  TestValidator.predicate("element", () => result.includes(`a[0]?.["x-y-z"]`));
};
