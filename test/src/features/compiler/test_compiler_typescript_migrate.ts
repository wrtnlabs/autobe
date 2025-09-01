import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { NestiaMigrateApplication } from "@nestia/migrate";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_typescript_migrate = async (): Promise<void> => {
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
    root: `${TestGlobal.ROOT}/assets/migrate/success`,
    files,
  });

  const compiler: AutoBeTypeScriptCompiler = new AutoBeTypeScriptCompiler();
  const result: IAutoBeTypeScriptCompileResult = await compiler.compile({
    files: Object.fromEntries(
      Object.entries(files)
        .filter(([k]) => k.startsWith("src") && k.endsWith(".ts"))
        .map(([k, v]) => [k, v.replaceAll("@link", "#link")]),
    ),
  });
  if (result.type === "failure") console.log(result.diagnostics);
  TestValidator.equals("result", result.type, "success");
  typia.assertEquals(result);
};
