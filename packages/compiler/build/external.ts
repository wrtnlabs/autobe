/// <reference types="node" />
import { MigrateApplication } from "@nestia/migrate";
import fs from "fs";
import { IValidation } from "typia";

import { AutoBeCompilerBase } from "../src/internal/AutoBeCompilerBase";
import { UnpkgDownloader } from "./internal/UnpkgDownloader";

const code = async (): Promise<Record<string, string>> => {
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
  return Object.fromEntries(
    files.map((f) => [`${f.location}/${f.file}`, f.content]),
  );
};

const main = async (): Promise<void> => {
  const external: Record<string, string> = {};
  const unpkg: UnpkgDownloader = new UnpkgDownloader();
  const compiler: AutoBeCompilerBase = new AutoBeCompilerBase((file) => {
    if (file.startsWith("node_modules/") === false) return undefined;
    const splitted: string[] = file.split("/");
    const namespaced: boolean = !!splitted[0]?.startsWith("@");
    if (splitted.length < (namespaced ? 3 : 2)) return undefined;

    const [lib, path] = namespaced
      ? [`${splitted[1]}/${splitted[2]}`, splitted.slice(3).join("/")]
      : [splitted[1]!, splitted.slice(2).join("/")];
    const result: string | undefined = unpkg.get(lib, path);
    if (result === undefined) return undefined;
    external[file] = [`/// <reference types="node" />`, result].join("\n\n");
    return result;
  }, []);
  compiler.compile({
    files: await code(),
  });

  await fs.promises.writeFile(
    `${__dirname}/../src/raw/external.json`,
    JSON.stringify(external),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-11);
});
