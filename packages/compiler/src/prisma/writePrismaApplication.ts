import { AutoBePrisma } from "@autobe/interface";

import { ArrayUtil } from "../utils/ArrayUtil";
import { MapUtil } from "../utils/MapUtil";

export function writePrismaApplication(
  app: AutoBePrisma.IApplication,
): Record<string, string> {
  for (const file of app.files)
    for (const model of file.models) fillMappingName(model);
  return {
    ...Object.fromEntries(
      app.files
        .filter((file) => file.filename !== "main.prisma")
        .map((file) => [file.filename, writeFile(app, file)]),
    ),
    "main.prisma": MAIN_FILE,
  };
}

function writeFile(
  app: AutoBePrisma.IApplication,
  file: AutoBePrisma.IFile,
): string {
  return file.models.map((model) => writeModel(app, file, model)).join("\n\n");
}

function writeModel(
  app: AutoBePrisma.IApplication,
  file: AutoBePrisma.IFile,
  model: AutoBePrisma.IModel,
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

function fillMappingName(model: AutoBePrisma.IModel): void {
  const group: Map<string, AutoBePrisma.IForeignField[]> = new Map();
  for (const ff of model.foreignFields) {
    MapUtil.take(group, ff.relation.targetModel, () => []).push(ff);
    if (ff.relation.targetModel == model.name)
      ff.relation.mappingName = "recursive";
  }
  for (const array of group.values())
    if (array.length !== 1)
      for (const ff of array) {
        ff.relation.mappingName = `${model.name}_of_${ff.name}`;
      }
}

/* -----------------------------------------------------------
  COLUMNS
----------------------------------------------------------- */
function writeColumns(model: AutoBePrisma.IModel): string[] {
  return [
    "//----",
    "// COLUMNS",
    "//----",
    writePrimary(model.primaryField),
    ...model.foreignFields.map((x) => ["", writeField(x)]).flat(),
    ...model.plainFields.map((x) => ["", writeField(x)]).flat(),
  ];
}

function writePrimary(field: AutoBePrisma.IPrimaryField): string {
  return [
    writeComment(field.description),
    `${field.name} String @id @db.Uuid`,
  ].join("\n");
}

function writeField(field: AutoBePrisma.IPlainField): string {
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
  app: AutoBePrisma.IApplication,
  model: AutoBePrisma.IModel,
): string[] {
  interface IHasRelationship {
    modelName: string;
    unique: boolean;
    mappingName?: string;
  }
  const hasRelationships: IHasRelationship[] = app.files
    .map((otherFile) =>
      otherFile.models.map((otherModel) =>
        otherModel.foreignFields
          .filter(
            (otherForeign) => otherForeign.relation.targetModel === model.name,
          )
          .map((otherForeign) => ({
            modelName: otherModel.name,
            unique: otherForeign.unique,
            mappingName: otherForeign.relation.mappingName,
          })),
      ),
    )
    .flat(2);
  const foreignIndexes: AutoBePrisma.IForeignField[] =
    model.foreignFields.filter(
      (f) =>
        model.uniqueIndexes.every((u) => u.fieldNames[0] !== f.name) &&
        (f.unique === true ||
          model.plainIndexes.every((p) => p.fieldNames[0] !== f.name)),
    );
  const contents: string[][] = [
    model.foreignFields.map(writeConstraint),
    hasRelationships.map((r) =>
      [
        r.mappingName ?? r.modelName,
        `${r.modelName}${r.unique ? "?" : "[]"}`,
        ...(r.mappingName ? [`@relation("${r.mappingName}")`] : []),
      ].join(" "),
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

function writeConstraint(field: AutoBePrisma.IForeignField): string {
  return [
    field.relation.name,
    `${field.relation.targetModel}${field.nullable ? "?" : ""}`,
    `@relation(${[
      ...(field.relation.mappingName
        ? [`"${field.relation.mappingName}"`]
        : []),
      `fields: [${field.name}]`,
      `references: [id]`,
      `onDelete: Cascade`,
    ].join(", ")})`,
  ].join(" ");
}

function writeForeignIndex(field: AutoBePrisma.IForeignField): string {
  return `@@${field.unique === true ? "unique" : "index"}([${field.name}])`;
}

function writeUniqueIndex(field: AutoBePrisma.IUniqueIndex): string {
  return `@@unique([${field.fieldNames.join(", ")}])`;
}

function writePlainIndex(field: AutoBePrisma.IPlainIndex): string {
  return `@@index([${field.fieldNames.join(", ")}])`;
}

function writeGinIndex(field: AutoBePrisma.IGinIndex): string {
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
