import { AutoBeRealizeOperationProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeOperationProgrammer";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "typia";

/**
 * When operation code properly uses both ArticleTransformer.select() and
 * ArticleTransformer.transform(), no contract errors should be emitted.
 */
export const test_realize_operation_validate_contract_both_present =
  (): void => {
    const code: string = [
      "export async function getArticle(props: { id: string }): Promise<IArticle> {",
      "  const record = await MyGlobal.prisma.articles.findFirstOrThrow({",
      "    ...ArticleTransformer.select(),",
      "    where: { id: props.id },",
      "  });",
      "  return await ArticleTransformer.transform(record);",
      "}",
    ].join("\n");

    const errors: IValidation.IError[] =
      AutoBeRealizeOperationProgrammer.validateSelectTransformContract({
        draft: code,
        revise: { final: null },
      });

    TestValidator.equals("should have 0 errors", errors.length, 0);
  };
