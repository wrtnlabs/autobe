import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator, RepositoryFileSystem } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { invertOpenApiDocument } from "@autobe/utils";
import { OpenApi } from "@samchon/openapi";
import fs from "fs";
import path from "path";

const DIRECTORY = path.resolve(__dirname, "../prompts");

const prepareExample = async (
  title: string,
): Promise<Record<string, string>> => {
  await RepositoryFileSystem.clone("samchon", `${title}-backend`);
  const directory: string = path.resolve(
    `${__dirname}/../../../internals/repositories/samchon/${title}-backend`,
  );
  const analysis: Record<string, string> = await FileSystemIterator.read({
    root: path.resolve(`${directory}`),
    extension: "md",
  });
  const prisma = await new AutoBePrismaCompiler().compile({
    files: await FileSystemIterator.read({
      root: path.resolve(`${directory}/prisma/schema`),
      extension: "prisma",
    }),
  });
  if (prisma.type !== "success") {
    console.log(prisma);
    throw new Error("Failed to compile prisma");
  }

  const swagger: OpenApi.IDocument = await RepositoryFileSystem.swagger(
    "samchon",
    `${title}-backend`,
  );
  const document: AutoBeOpenApi.IDocument = invertOpenApiDocument(swagger);

  return {
    [`EXAMPLE_${title.toUpperCase()}_ANALYSIS`]: JSON.stringify(analysis),
    [`EXAMPLE_${title.toUpperCase()}_PRISMA`]: JSON.stringify({
      schemas: prisma.schemas,
      diagrams: prisma.diagrams,
      document: prisma.document,
    }),
    [`EXAMPLE_${title.toUpperCase()}_PRISMA_SCHEMAS`]: JSON.stringify(
      prisma.schemas,
    ),
    [`EXAMPLE_${title.toUpperCase()}_INTERFACE_ENDPOINTS`]: JSON.stringify({
      endpoints: document.operations.map((o) => ({
        path: o.path,
        method: o.method,
      })),
    }),
    [`EXAMPLE_${title.toUpperCase()}_INTERFACE_OPERATIONS`]: JSON.stringify({
      operations: document.operations,
    }),
  };
};

async function main(): Promise<void> {
  const directory: string[] = await fs.promises.readdir(DIRECTORY);
  const record: Record<string, string> = {};
  const examples: Record<string, string> = {
    ...(await prepareExample("bbs")),
    ...(await prepareExample("shopping")),
  };

  for (const file of directory) {
    if (file.endsWith(".md") === false) {
      continue;
    }
    let content: string = await fs.promises.readFile(
      `${DIRECTORY}/${file}`,
      "utf8",
    );
    content = content.replaceAll("\r\n", "\n").trim();
    for (const [key, value] of Object.entries(examples))
      content = content.replace(`{% ${key} %}`, value);
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
            `  ${key.toUpperCase()} = ${JSON.stringify(value)},`,
        ),
        // ...Object.entries(examples).map(
        //   ([key, value]) =>
        //     `  ${key.toUpperCase()} = ${JSON.stringify(value)},`,
        // ),
        `};`,
        "",
      ].join("\n"),
    },
  });
}
main().catch(console.error);
