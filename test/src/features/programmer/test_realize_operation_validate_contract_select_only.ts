import { AutoBeRealizeOperationProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeOperationProgrammer";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "typia";

/**
 * When operation code uses ArticleTransformer.select() but never calls
 * ArticleTransformer.transform(), an error must be emitted.
 */
export const test_realize_operation_validate_contract_select_only =
  (): void => {
    const code: string = [
      "export async function getArticle(props: { id: string }): Promise<IArticle> {",
      "  const record = await MyGlobal.prisma.articles.findFirstOrThrow({",
      "    ...ArticleTransformer.select(),",
      "    where: { id: props.id },",
      "  });",
      "  return { id: record.id, title: record.title };",
      "}",
    ].join("\n");

    const errors: IValidation.IError[] =
      AutoBeRealizeOperationProgrammer.validateSelectTransformContract({
        draft: code,
        revise: { final: null },
      });

    TestValidator.equals("should have 1 error", errors.length, 1);
    TestValidator.equals(
      "error mentions transform",
      errors[0]!.expected!.includes("ArticleTransformer.transform()"),
      true,
    );
  };
