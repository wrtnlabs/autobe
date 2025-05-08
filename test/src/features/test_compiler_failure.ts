import { AutoBeCompiler, IAutoBeCompilerResult } from "@autobe/compiler";
import { TestValidator } from "@nestia/e2e";
import { MigrateApplication } from "@nestia/migrate";
import fs from "fs";
import { IValidation } from "typia";

import { TestGlobal } from "../TestGlobal";

export const test_compiler_failure = async (): Promise<void> => {
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

  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const result: IAutoBeCompilerResult = compiler.compile({
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
    paths: {
      "@ORGANIZATION/PROJECT-api/lib/*": ["./src/api/*"],
      "@ORGANIZATION/PROJECT-api": ["./src/api"],
    },
  });
  TestValidator.predicate("failure")(
    () =>
      result.type === "failure" &&
      result.diagnostics.length === 1 &&
      !!result.diagnostics[0]?.messageText.includes("asdfasdfasfewfds"),
  );
};
