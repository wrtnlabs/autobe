import { FileSystemIterator } from "@autobe/filesystem";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import path from "path";

const DIRECTORY = path.resolve(__dirname, "../prompts");
FileSystemIterator;
StringUtil;

async function main(): Promise<void> {
  const all: string[] = [];
  for (const file of await fs.promises.readdir(DIRECTORY)) {
    if (file.endsWith(".md") === false) continue;
    const content: string = await fs.promises.readFile(
      `${DIRECTORY}/${file}`,
      "utf-8",
    );
    all.push(content);
  }

  const content: string = all.join(
    ["\n\n", `<div style="page-break-after: always;"></div>`, "\n\n"].join(""),
  );
  try {
    await fs.promises.mkdir(`${DIRECTORY}/aggregate`);
  } catch {}
  await fs.promises.writeFile(
    `${DIRECTORY}/aggregate/ALL.md`,
    content,
    "utf-8",
  );
}
main().catch(console.error);
