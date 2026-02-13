import { FileSystemIterator } from "@autobe/filesystem";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import path from "path";

async function buildTemplate(): Promise<void> {
  const record: Record<string, string> = {};
  const read = async (location: string): Promise<void> => {
    const content: string = await fs.promises.readFile(
      path.resolve(__dirname, "../../../internals/template", location),
      "utf8",
    );
    record[location] = content.trim();
  };
  await read("realize-of-postgres/src/MyGlobal.ts");
  await FileSystemIterator.save({
    files: {
      "AutoBeTemplateFileConstant.ts": [
        `/* eslint-disable no-template-curly-in-string */`,
        `export const enum AutoBeTemplateFileConstant {`,
        ...Object.entries(record).map(
          ([key, value]) =>
            `  ${JSON.stringify(key)} = ${JSON.stringify(value)},`,
        ),
        "}",
      ].join("\n"),
    },
    root: path.resolve(__dirname, "../src/constants"),
    overwrite: true,
  });
}

async function buildPrompts(): Promise<void> {
  const DIRECTORY = path.resolve(__dirname, "../prompts");

  const fileList: string[] = await fs.promises.readdir(DIRECTORY);
  const record: Record<string, string> = {};
  for (const file of fileList) {
    if (file.endsWith(".md") === false) {
      continue;
    }
    let content: string = await fs.promises.readFile(
      `${DIRECTORY}/${file}`,
      "utf8",
    );
    content = content.replaceAll("\r\n", "\n").trim();
    record[file.substring(0, file.length - 3)] = content;
  }
  await FileSystemIterator.save({
    root: path.resolve(__dirname, "../src/constants"),
    files: {
      "AutoBeSystemPromptConstant.ts": [
        `/* eslint-disable no-template-curly-in-string */`,
        `export const enum AutoBeSystemPromptConstant {`,
        ...Object.entries(record).map(
          ([key, value]) =>
            `  ${key.toUpperCase()} = ${JSON.stringify(StringUtil.trim`
                <!--
                filename: ${key.toUpperCase()}.md
                -->
                ${value}
              `)},`,
        ),
        "};",
        "",
      ].join("\n"),
    },
    overwrite: true,
  });
}

const main = async (): Promise<void> => {
  await buildPrompts();
  await buildTemplate();
};

main().catch(console.error);
