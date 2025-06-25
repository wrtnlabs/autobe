import { FileSystemIterator } from "@autobe/filesystem";
import fs from "fs";

const main = async (): Promise<void> => {
  const files: Record<string, string> = await FileSystemIterator.read({
    root: `${__dirname}/../../../internals/template`,
  });
  try {
    await fs.promises.mkdir(`${__dirname}/../src/raw`);
  } catch {}
  await fs.promises.writeFile(
    `${__dirname}/../src/raw/AutoBeCompilerTemplate.ts`,
    [
      `export const AutoBeCompilerTemplate: Record<string, string> = ${JSON.stringify(files, null, 2)};`,
    ].join("\n"),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
