import { AutoBeTest } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { prepare_compiler_test } from "./internal/prepare_compiler_test";

export const test_compiler_test_write_predicate = async (): Promise<void> => {
  const { compiler, document, scenario } = await prepare_compiler_test();
  const expressions: AutoBeTest.IExpression[] = [
    {
      type: "equalPredicate",
      title: "equal_to",
      x: {
        type: "booleanLiteral",
        value: true,
      },
      y: {
        type: "booleanLiteral",
        value: true,
      },
    },
    {
      type: "notEqualPredicate",
      title: "not_equal_to",
      x: {
        type: "numericLiteral",
        value: 10,
      },
      y: {
        type: "numericLiteral",
        value: 20,
      },
    },
    {
      type: "conditionalPredicate",
      title: "conditional",
      expression: {
        type: "booleanLiteral",
        value: true,
      },
    },
    {
      type: "errorPredicate",
      title: "error",
      function: {
        type: "arrowFunction",
        body: {
          type: "block",
          statements: [
            {
              type: "throwStatement",
              expression: {
                type: "newExpression",
                expression: {
                  type: "identifier",
                  text: "Error",
                },
                arguments: [
                  {
                    type: "stringLiteral",
                    value: "intended error",
                  },
                ],
              },
            },
          ],
        },
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

  TestValidator.predicate("equal")(() =>
    result.includes(`TestValidator.equals("equal_to")(true)(true)`),
  );
  TestValidator.predicate("notEqual")(() =>
    result.includes(
      `TestValidator.error("not_equal_to")(() => TestValidator.equals("not_equal_to")(10)(20))`,
    ),
  );
  TestValidator.predicate("conditional")(() =>
    result.includes(`TestValidator.predicate("conditional")(true)`),
  );
  TestValidator.predicate("error")(
    () =>
      result.includes(`TestValidator.error("error")(async () => {`) &&
      result.includes(`throw new Error("intended error")`),
  );
};
