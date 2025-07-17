import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";

export const test_compiler_interface_write = async (
  factory: TestFactory,
): Promise<void> => {
  const compiler: AutoBeCompiler = factory.createCompiler();
  const document: AutoBeOpenApi.IDocument = await compiler.interface.invert(
    OpenApi.convert(
      await fetch(
        "https://raw.githubusercontent.com/samchon/bbs-backend/master/packages/api/swagger.json",
      ).then((r) => r.json()),
    ),
  );
  const files: Record<string, string> =
    await compiler.interface.write(document);
  typia.assertEquals(files);

  const root: string = `${TestGlobal.ROOT}/results/compiler.interface.write`;
  await FileSystemIterator.save({
    root,
    files,
  });
};
