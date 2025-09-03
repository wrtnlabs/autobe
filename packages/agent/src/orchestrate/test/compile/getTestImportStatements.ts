import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

export const getTestImportStatements = (
  document: AutoBeOpenApi.IDocument,
): string => {
  const typeReferences: string[] = Array.from(
    new Set(
      Object.keys(document.components.schemas).map((key) => key.split(".")[0]!),
    ),
  ).sort();
  return StringUtil.trim`
    import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
    import { IConnection } from "@nestia/fetcher";
    import typia, { tags } from "typia";
    
    import api from "@ORGANIZATION/PROJECT-api";
    ${typeReferences
      .map(
        (ref) =>
          `import type { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
      )
      .join("\n")}
  `;
};
