import { AutoBePrismaCompiler } from "@autobe/compiler";
import { FileSystemIterator, TestRepositoryUtil } from "@autobe/filesystem";
import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi, OpenApiV3_1 } from "@samchon/openapi";
import fs from "fs";
import typia from "typia";

import { invertOpenApiDocument } from "../src/factory";

interface IProjectExample {
  analyze: Record<string, string>;
  prisma: {
    schemas: Record<string, string>;
    diagrams: Record<string, string>;
    document: string;
  };
  document: AutoBeOpenApi.IDocument;
}

const example = async (
  account: string,
  project: string,
): Promise<IProjectExample> => {
  const prisma = await new AutoBePrismaCompiler().compile({
    files: await TestRepositoryUtil.prisma(account, project),
  });
  if (prisma.type !== "success") throw new Error("Prisma compilation failed.");

  const swagger: OpenApi.IDocument = OpenApi.convert(
    typia.assert<OpenApiV3_1.IDocument>(
      await fetch(
        `https://raw.githubusercontent.com/${account}/${project}/refs/heads/master/packages/api/swagger.json`,
      ).then((r) => r.json()),
    ),
  );
  return {
    analyze: await FileSystemIterator.read({
      root: `${__dirname}/../../../examples/${project}/analyze`,
      prefix: "",
      extension: "md",
    }),
    prisma: {
      schemas: prisma.schemas,
      diagrams: prisma.diagrams,
      document: prisma.document,
    },
    document: invertOpenApiDocument(swagger),
  };
};
const main = async () => {
  const json: Record<string, IProjectExample> = {
    bbs: await example("samchon", "bbs-backend"),
    shopping: await example("samchon", "shopping-backend"),
  };
  await fs.promises.writeFile(
    `${__dirname}/../src/constants/examples.json`,
    JSON.stringify(json),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
