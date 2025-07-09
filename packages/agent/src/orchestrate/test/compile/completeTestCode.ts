import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export function completeTestCode(
  artifacts: IAutoBeTestScenarioArtifacts,
  code: string,
): string {
  const typeReferences: string[] = Array.from(
    new Set(
      Object.keys(artifacts.document.components.schemas).map(
        (key) => key.split(".")[0]!,
      ),
    ),
  );

  code = code.replace(/^[ \t]*import\b[\s\S]*?;[ \t]*$/gm, "").trim();
  code = code.replace(/^[ \t]*import\b[\s\S]*?;[ \t]*$/gm, "").trim();
  code = code.replaceAll(
    'string & Format<"uuid">',
    'string & tags.Format<"uuid">',
  );
  code = [
    `import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";`,
    `import { IConnection } from "@nestia/fetcher";`,
    `import typia, { tags } from "typia";`,
    "",
    `import api from "@ORGANIZATION/PROJECT-api";`,
    ...typeReferences.map(
      (ref) =>
        `import type { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
    ),
    "",
    code,
  ].join("\n");
  return code;
}
