import { factory } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi } from "@samchon/openapi";
import typia from "typia";

import { TestGlobal } from "../../TestGlobal";

export const test_compiler_interface_bbs = async (): Promise<void> => {
  const compiler: AutoBeCompiler = new AutoBeCompiler();
  const document: AutoBeOpenApi.IDocument = factory.invertOpenApiDocument(
    OpenApi.convert(
      await fetch(
        "https://raw.githubusercontent.com/samchon/bbs-backend/master/packages/api/swagger.json",
      ).then((r) => r.json()),
    ),
  );
  const result: Record<string, string> = await compiler.interface(document);
  typia.assertEquals(result);

  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/samchon/bbs-backend/invert`,
    files: result,
  });
};
