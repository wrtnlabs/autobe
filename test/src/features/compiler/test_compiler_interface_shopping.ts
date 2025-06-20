import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi } from "@samchon/openapi";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_interface_shopping = async (): Promise<void> => {
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const document: AutoBeOpenApi.IDocument = await compiler.interface.invert(
    OpenApi.convert(
      await fetch(
        "https://raw.githubusercontent.com/samchon/shopping-backend/master/packages/api/swagger.json",
      ).then((r) => r.json()),
    ),
  );
  const result: Record<string, string> =
    await compiler.interface.compile(document);
  typia.assertEquals(result);

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/samchon/shopping-backend/invert`,
    files: result,
  });
};
