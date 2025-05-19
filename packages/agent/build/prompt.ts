const fs = require("node:fs");
const path = require("node:path");

const DIRECTORY = path.join(__dirname, "../prompts");

async function main(): Promise<void> {
  const directory: string = await fs.promises.readdir(DIRECTORY);
  const record: Record<string, string> = {};

  for (const file of directory) {
    if (file.endsWith(".md") === false) {
      continue;
    }
    const content: string = await fs.promises.readFile(
      `${DIRECTORY}/${file}`,
      "utf8",
    );
    record[file.substring(0, file.length - 3)] = content
      .split("\r\n")
      .join("\n")
      .trim();
  }
  await fs.promises.writeFile(
    path.join(__dirname, "../src/constants/AutoBeSystemPrompt.ts"),
    [
      `/* eslint-disable no-template-curly-in-string */`,
      `export const AutoBeSystemPrompt = {`,
      ...Object.entries(record).map(
        ([key, value]) =>
          `  ${key.toUpperCase()}:\n    ${JSON.stringify(value)},`,
      ),
      `};`,
      "",
    ].join("\n"),
    "utf8",
  );
}
main().catch(console.error);
