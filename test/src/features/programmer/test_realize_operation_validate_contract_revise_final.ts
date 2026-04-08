import { AutoBeRealizeOperationProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeOperationProgrammer";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "typia";

/**
 * Draft is valid but revise.final has a broken contract (transform without
 * select). Should emit 1 error on the revise.final path.
 */
export const test_realize_operation_validate_contract_revise_final =
  (): void => {
    const validDraft: string = [
      "export async function getArticle(): Promise<IArticle> {",
      "  const r = await MyGlobal.prisma.articles.findFirstOrThrow({",
      "    ...ArticleTransformer.select(),",
      "  });",
      "  return await ArticleTransformer.transform(r);",
      "}",
    ].join("\n");

    const brokenFinal: string = [
      "export async function getArticle(): Promise<IArticle> {",
      "  const r = await MyGlobal.prisma.articles.findFirstOrThrow({",
      "    where: { id: 'x' },",
      "  });",
      "  return await ArticleTransformer.transform(r);",
      "}",
    ].join("\n");

    const errors: IValidation.IError[] =
      AutoBeRealizeOperationProgrammer.validateSelectTransformContract({
        draft: validDraft,
        revise: { final: brokenFinal },
      });

    TestValidator.equals(
      "should have 1 error from revise.final",
      errors.length,
      1,
    );
    TestValidator.equals(
      "error path is revise.final",
      errors[0]!.path,
      "$input.request.revise.final",
    );
  };
