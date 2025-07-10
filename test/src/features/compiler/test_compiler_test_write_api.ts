import { AutoBeTest } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { prepare_compiler_test } from "./internal/prepare_compiler_test";

export async function test_compiler_test_write_api(): Promise<void> {
  const { compiler, document, scenario } = await prepare_compiler_test();
  const stmt: AutoBeTest.IApiOperateStatement = {
    type: "apiOperateStatement",
    endpoint: {
      method: "patch",
      path: "/bbs/articles",
    },
    argument: {
      type: "objectLiteralExpression",
      properties: [
        {
          type: "propertyAssignment",
          name: "body",
          value: {
            type: "objectLiteralExpression",
            properties: [],
          },
        },
      ],
    },
    variableName: "page",
  };
  const result: string = await compiler.write({
    document,
    scenario,
    function: {
      plan: "",
      draft: "",
      statements: [stmt],
    },
  });

  TestValidator.predicate("import")(() =>
    result.includes(
      `import { IPageIBbsArticle } from "@ORGANIZATION/IPageIBbsArticle-api/lib/structures/IPageIBbsArticle"`,
    ),
  );
  TestValidator.predicate("call")(() =>
    result.includes(
      `const page: IPageIBbsArticle.ISummary = await api.bbs.articles.patch(connection, {`,
    ),
  );
  TestValidator.predicate("assert")(() =>
    result.includes(`typia.assert(page)`),
  );
}
