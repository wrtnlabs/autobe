import { MigrateApplication } from "@nestia/migrate";
import { IValidation } from "typia";

import { AutoBeCompiler } from "../AutoBeCompiler";
import { IAutoBeCompilerResult } from "../structures/IAutoBeCompilerResult";

const main = async (): Promise<void> => {
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

  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const result: IAutoBeCompilerResult = compiler.compile({
    ...Object.fromEntries(
      files
        .filter((f) => f.location.startsWith("src") && f.file.endsWith(".ts"))
        .map((f) => [`${f.location}/${f.file}`, f.content]),
    ),
    "src/controllers/wrong.ts": "asdfadsfdsa;",
  });
  if (result.type === "failure") console.log(result.diagnostics[0]);
};
main().catch(console.error);
