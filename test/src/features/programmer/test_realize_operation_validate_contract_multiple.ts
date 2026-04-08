import { AutoBeRealizeOperationProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeOperationProgrammer";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "typia";

/**
 * Composite operation using two transformers: ArticleTransformer (both present)
 * and UserTransformer (select only, missing transform). Should emit exactly 1
 * error.
 */
export const test_realize_operation_validate_contract_multiple = (): void => {
  const code: string = [
    "export async function getDashboard(): Promise<IDashboard> {",
    "  const articles = await MyGlobal.prisma.articles.findMany({",
    "    ...ArticleTransformer.select(),",
    "  });",
    "  const users = await MyGlobal.prisma.users.findMany({",
    "    ...UserTransformer.select(),",
    "  });",
    "  return {",
    "    articles: await ArrayUtil.asyncMap(articles, ArticleTransformer.transform),",
    "    users: users.map(u => ({ id: u.id, name: u.name })),",
    "  };",
    "}",
  ].join("\n");

  const errors: IValidation.IError[] =
    AutoBeRealizeOperationProgrammer.validateSelectTransformContract({
      draft: code,
      revise: { final: null },
    });

  TestValidator.equals(
    "should have 1 error for UserTransformer",
    errors.length,
    1,
  );
  TestValidator.equals(
    "error mentions UserTransformer.transform()",
    errors[0]!.expected!.includes("UserTransformer.transform()"),
    true,
  );
};
