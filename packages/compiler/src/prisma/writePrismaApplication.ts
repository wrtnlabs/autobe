import { AutoBePrismaSyntax } from "@autobe/interface";

import { ArrayUtil } from "../utils/ArrayUtil";

export function writePrismaApplication(
  app: AutoBePrismaSyntax.IApplication,
): Record<string, string> {
  return {
    ...Object.fromEntries(
      app.files.map((file) => [file.filename, writeFile(app, file)]),
    ),
    "main.prisma": MAIN_FILE,
  };
}

function writeFile(
  app: AutoBePrismaSyntax.IApplication,
  file: AutoBePrismaSyntax.IFile,
): string {
  return file.models.map((model) => writeModel(app, file, model)).join("\n\n");
}

function writeModel(
  app: AutoBePrismaSyntax.IApplication,
  file: AutoBePrismaSyntax.IFile,
  model: AutoBePrismaSyntax.IModel,
): string {
  return [
    writeComment(
      [
        model.description,
        "",
        ...(model.material ? [] : [`@namespace ${file.namespace}`]),
        "@author AutoBE - https://github.com/wrtnlabs/autobe",
      ].join("\n"),
    ),
    `model ${model.name} {`,
    indent(
      ArrayUtil.paddle([writeColumns(model), writeRelations(app, model)]).join(
        "\n",
      ),
    ),
    "}",
  ].join("\n");
}

/* -----------------------------------------------------------
  COLUMNS
----------------------------------------------------------- */
function writeColumns(model: AutoBePrismaSyntax.IModel): string[] {
  return [
    "//----",
    "// COLUMNS",
    "//----",
    writePrimary(model.primaryField),
    ...model.foreignFields.map(writeField),
    ...model.plainFields.map(writeField),
  ];
}

function writePrimary(field: AutoBePrismaSyntax.IPrimaryField): string {
  return [
    writeComment(field.description),
    `${field.name} String @id @db.Uuid`,
  ].join("\n");
}

function writeField(field: AutoBePrismaSyntax.IPlainField): string {
  const logical: string = LOGICAL_TYPES[field.type];
  const physical: string | undefined =
    PHYSICAL_TYPES[field.type as keyof typeof PHYSICAL_TYPES];
  return [
    writeComment(field.description),
    [
      field.name,
      `${logical}${field.nullable ? "?" : ""}`,
      ...(physical ? [physical] : []),
    ].join(" "),
  ].join("\n");
}

/* -----------------------------------------------------------
  RELATIONS
----------------------------------------------------------- */
function writeRelations(
  app: AutoBePrismaSyntax.IApplication,
  model: AutoBePrismaSyntax.IModel,
): string[] {
  interface IHasRelationship {
    modelName: string;
    unique: boolean;
  }
  const hasRelationships: IHasRelationship[] = app.files
    .map((otherFile) =>
      otherFile.models.map((otherModel) =>
        otherModel.foreignFields
          .filter((foreign) => foreign.relation.targetModel === otherModel.name)
          .map((foreign) => ({
            modelName: otherModel.name,
            unique: foreign.unique,
          })),
      ),
    )
    .flat(2);
  const foreignIndexes: AutoBePrismaSyntax.IForeignField[] =
    model.foreignFields.filter(
      (f) =>
        model.uniqueIndexes.every((u) => u.fieldNames[0] !== f.name) &&
        model.plainIndexes.every((p) => p.fieldNames[0] !== f.name),
    );
  const contents: string[][] = [
    model.foreignFields.map(writeConstraint),
    hasRelationships.map(
      (r) => `${r.modelName} ${r.modelName}${r.unique ? "?" : "[]"}`,
    ),
    foreignIndexes.map(writeForeignIndex),
    [
      ...model.uniqueIndexes.map(writeUniqueIndex),
      ...model.plainIndexes.map(writePlainIndex),
      ...model.ginIndexes.map(writeGinIndex),
    ],
  ];
  if (contents.every((c) => c.length === 0)) return [];
  return [
    "//----",
    "// RELATIONS",
    "//----",
    // paddled content
    ...ArrayUtil.paddle(contents),
  ];
}

function writeConstraint(field: AutoBePrismaSyntax.IForeignField): string {
  return [
    field.relation.name,
    `${field.relation.targetModel}${field.nullable ? "?" : ""}`,
    `@relation(fields: [${field.name}], references: [id], onDelete: Cascade)`,
  ].join(" ");
}

function writeForeignIndex(field: AutoBePrismaSyntax.IForeignField): string {
  return `@@${field.unique ? "unique" : "index"}([${field.name}])`;
}

function writeUniqueIndex(field: AutoBePrismaSyntax.IUniqueIndex): string {
  return `@@unique([${field.fieldNames.join(", ")}])`;
}

function writePlainIndex(field: AutoBePrismaSyntax.IPlainIndex): string {
  return `@@index([${field.fieldNames.join(", ")}])`;
}

function writeGinIndex(field: AutoBePrismaSyntax.IGinIndex): string {
  return `@@index([${field.fieldName}(ops: raw("gin_trgm_ops"))], type: Gin)`;
}

/* -----------------------------------------------------------
  BACKGROUND
----------------------------------------------------------- */
function writeComment(content: string): string {
  return content
    .split("\r\n")
    .join("\n")
    .split("\n")
    .map((str) => `///${str.length ? ` ${str}` : ""}`)
    .join("\n")
    .trim();
}

function indent(content: string): string {
  return content
    .split("\r\n")
    .join("\n")
    .split("\n")
    .map((str) => `  ${str}`)
    .join("\n");
}

const LOGICAL_TYPES = {
  // native types
  boolean: "Boolean",
  int: "Int",
  double: "Float",
  string: "String",
  // formats
  date: "Date",
  datetime: "DateTime",
  uuid: "String",
  uri: "String",
};

const PHYSICAL_TYPES = {
  int: "@db.Integer",
  double: "@db.DoublePrecision",
  uuid: "@db.Uuid",
  datetime: "@db.Timestamptz",
  uri: "@db.VarChar(80000)",
};

const MAIN_FILE = `
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "views"]
  binaryTargets   = ["native"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = []
}

generator markdown {
  provider = "prisma-markdown"
  output   = "../docs/ERD.md"
}
`.trim();
