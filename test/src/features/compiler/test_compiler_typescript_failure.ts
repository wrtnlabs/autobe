import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { IAutoBeTypeScriptCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { NestiaMigrateApplication } from "@nestia/migrate";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_typescript_failure = async (): Promise<void> => {
  const migrate: NestiaMigrateApplication = new NestiaMigrateApplication(
    await fetch("https://shopping-be.wrtn.ai/editor/swagger.json").then((r) =>
      r.json(),
    ),
  );
  const files: Record<string, string> = migrate.nest({
    keyword: true,
    simulate: true,
    e2e: true,
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/assets/migrate/failure`,
    files,
  });

  const compiler: AutoBeTypeScriptCompiler = new AutoBeTypeScriptCompiler();
  const result: IAutoBeTypeScriptCompilerResult = await compiler.compile({
    files: {
      ...Object.fromEntries(
        Object.entries(files)
          .filter(([k]) => k.startsWith("src") && k.endsWith(".ts"))
          .map(([k, v]) => [k, v.replaceAll("@link", "#link")]),
      ),
      "src/error.ts": "asdfasdfasfewfds;",
    },
  });
  TestValidator.predicate("result")(
    () =>
      result.type === "failure" &&
      result.diagnostics.length === 1 &&
      !!result.diagnostics[0]?.messageText.includes("asdfasdfasfewfds"),
  );
  typia.assertEquals(result);
};
