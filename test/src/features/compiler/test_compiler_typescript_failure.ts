import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import { IAutoBeTypeScriptCompilerResult } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { MigrateApplication } from "@nestia/migrate";
import fs from "fs";
import { IValidation } from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_typescript_failure = async (): Promise<void> => {
  const inspect: IValidation<MigrateApplication> = MigrateApplication.create(
    await fetch("https://shopping-be.wrtn.ai/editor/swagger.json").then((r) =>
      r.json(),
    ),
  );
  if (inspect.success === false)
    throw new Error("Failed to pass the validation");

  const app: MigrateApplication = inspect.data;
  const { files }: MigrateApplication.IOutput = app.nest({
    simulate: true,
    e2e: true,
  });
  const directory: string = `${TestGlobal.ROOT}/assets/migrate`;
  if (fs.existsSync(directory))
    await fs.promises.rm(directory, { recursive: true });
  await fs.promises.mkdir(directory, { recursive: true });
  for (const f of files) {
    await fs.promises.mkdir(`${directory}/${f.location}`.replace("//", "/"), {
      recursive: true,
    });
    await fs.promises.writeFile(
      `${directory}/${f.location}/${f.file}`.replace("//", "/"),
      f.content,
      "utf8",
    );
  }

  const compiler: AutoBeTypeScriptCompiler = new AutoBeTypeScriptCompiler();
  const result: IAutoBeTypeScriptCompilerResult = await compiler.compile({
    files: {
      ...Object.fromEntries(
        files
          .filter((f) => f.location.startsWith("src") && f.file.endsWith(".ts"))
          .map((f) => [
            `${f.location}/${f.file}`.replace("//", "/"),
            f.content.replaceAll("@link", "#link"),
          ]),
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
};
