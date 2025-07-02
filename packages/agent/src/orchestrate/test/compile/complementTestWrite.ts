import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export function complementTestWrite(props: {
  content: string;
  artifacts: IAutoBeTestScenarioArtifacts;
}): string {
  const typeReferences: string[] = Array.from(
    new Set(
      Object.keys(props.artifacts.document.components.schemas).map(
        (key) => key.split(".")[0]!,
      ),
    ),
  );

  let content: string = props.content
    .replace(/^[ \t]*import\b[\s\S]*?;[ \t]*$/gm, "")
    .trim();
  content = content.replace(/^[ \t]*import\b[\s\S]*?;[ \t]*$/gm, "").trim();
  content = content.replaceAll(
    'string & Format<"uuid">',
    'string & tags.Format<"uuid">',
  );
  content = [
    `import { TestValidator } from "@nestia/e2e";`,
    `import { IConnection } from "@nestia/fetcher";`,
    `import typia, { tags } from "typia";`,
    "",
    `import api from "@ORGANIZATION/PROJECT-api";`,
    ...typeReferences.map(
      (ref) =>
        `import type { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
    ),
    "",
    content,
  ].join("\n");
  return content;
}
