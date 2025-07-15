import { AutoBeTest } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { prepare_compiler_test } from "./internal/prepare_compiler_test";

export const test_compiler_test_write_random = async (
  factory: TestFactory,
): Promise<void> => {
  const { compiler, document, scenario } = await prepare_compiler_test(factory);
  const expressions: AutoBeTest.IExpression[] = [
    {
      type: "booleanRandom",
      probability: 0.75,
    },
    {
      type: "integerRandom",
      minimum: 0,
      maximum: 1000,
      multipleOf: 100,
    },
    {
      type: "numberRandom",
      minimum: 0.0,
      maximum: 10.0,
      multipleOf: 0.1,
    },
    {
      type: "stringRandom",
      minLength: 5,
      maxLength: 10,
    },
    {
      type: "formatRandom",
      format: "date-time",
    },
    {
      type: "patternRandom",
      pattern: "^[a-zA-Z0-9]{5,10}$",
    },
    {
      type: "pickRandom",
      array: {
        type: "arrayLiteralExpression",
        elements: [1, 2, 3, 4, 5].map((value) => ({
          type: "numericLiteral",
          value: value,
        })),
      },
    },
    {
      type: "sampleRandom",
      array: {
        type: "arrayLiteralExpression",
        elements: [1, 2, 3, 4, 5].map((value) => ({
          type: "numericLiteral",
          value: value,
        })),
      },
      count: {
        type: "numericLiteral",
        value: 2,
      },
    },
    ...typia.misc.literals<AutoBeTest.IKeywordRandom["keyword"]>().map(
      (keyword) =>
        ({
          type: "keywordRandom",
          keyword,
        }) satisfies AutoBeTest.IKeywordRandom,
    ),
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

  TestValidator.predicate("import")(
    () =>
      result.includes(`import { RandomGenerator } from "@nestia/e2e";`) &&
      result.includes(`import typia, { tags } from "typia";`),
  );
  TestValidator.predicate("boolean")(() =>
    result.includes(`Math.random() <= 0.75`),
  );
  TestValidator.predicate("integer")(() =>
    result.includes(
      `typia.random<number & tags.Type<"int32"> & tags.Minimum<0> & tags.Maximum<1000> & tags.MultipleOf<100>>()`,
    ),
  );
  TestValidator.predicate("number")(() =>
    result.includes(
      `typia.random<number & tags.Minimum<0> & tags.Maximum<10> & tags.MultipleOf<0.1>>()`,
    ),
  );
  TestValidator.predicate("string")(() =>
    result.includes(
      `typia.random<string & tags.MinLength<5> & tags.MaxLength<10>>()`,
    ),
  );
  TestValidator.predicate("date-time")(() =>
    result.includes(`typia.random<string & tags.Format<"date-time">>()`),
  );
  TestValidator.predicate("pattern")(() =>
    result.includes(
      `typia.random<string & tags.Pattern<"^[a-zA-Z0-9]{5,10}$">>()`,
    ),
  );
  TestValidator.predicate("pick")(result.includes("RandomGenerator.pick(["));
  TestValidator.predicate("sample")(
    result.includes("RandomGenerator.sample(["),
  );
  TestValidator.predicate("keyword")(
    () =>
      result.includes("RandomGenerator.alphabets();") &&
      result.includes("RandomGenerator.alphaNumeric();") &&
      result.includes("RandomGenerator.paragraph()();") &&
      result.includes("RandomGenerator.content()()();") &&
      result.includes("RandomGenerator.mobile();") &&
      result.includes("RandomGenerator.name();"),
  );
};
