import { AutoBePrisma } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

import { ArrayUtil } from "../utils/ArrayUtil";
import { MapUtil } from "../utils/MapUtil";

export function writePrismaApplication(props: {
  dbms: "postgres" | "sqlite";
  application: AutoBePrisma.IApplication;
}): Record<string, string> {
  for (const file of props.application.files)
    for (const model of file.models) fillMappingName(model);
  return {
    ...Object.fromEntries(
      props.application.files
        .filter((file) => file.filename !== "main.prisma")
        .map((file) => [
          file.filename,
          writeFile({
            ...props,
            file,
          }),
        ]),
    ),
    "main.prisma":
      props.dbms === "postgres" ? POSTGRES_MAIN_FILE : SQLITE_MAIN_FILE,
  };
}

function writeFile(props: {
  dbms: "postgres" | "sqlite";
  application: AutoBePrisma.IApplication;
  file: AutoBePrisma.IFile;
}): string {
  return props.file.models
    .map((model) =>
      writeModel({
        ...props,
        model,
      }),
    )
    .join("\n\n");
}

function writeModel(props: {
  dbms: "postgres" | "sqlite";
  application: AutoBePrisma.IApplication;
  file: AutoBePrisma.IFile;
  model: AutoBePrisma.IModel;
}): string {
  return [
    writeComment(
      [
        props.model.description,
        "",
        ...(props.model.material ? [] : [`@namespace ${props.file.namespace}`]),
        "@author AutoBE - https://github.com/wrtnlabs/autobe",
      ].join("\n"),
    ),
    `model ${props.model.name} {`,
    indent(
      ArrayUtil.paddle([writeColumns(props), writeRelations(props)]).join("\n"),
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
function writeColumns(props: {
  dbms: "postgres" | "sqlite";
  model: AutoBePrisma.IModel;
}): string[] {
  return [
    "//----",
    "// COLUMNS",
    "//----",
    writePrimary({
      dbms: props.dbms,
      field: props.model.primaryField,
    }),
    ...props.model.foreignFields
      .map((x) => [
        "",
        writeField({
          dbms: props.dbms,
          field: x,
        }),
      ])
      .flat(),
    ...props.model.plainFields
      .map((x) => [
        "",
        writeField({
          dbms: props.dbms,
          field: x,
        }),
      ])
      .flat(),
  ];
}

function writePrimary(props: {
  dbms: "postgres" | "sqlite";
  field: AutoBePrisma.IPrimaryField;
}): string {
  const type: string | undefined =
    props.dbms === "postgres" ? POSTGRES_PHYSICAL_TYPES.uuid : undefined;
  return [
    writeComment(props.field.description),
    `${props.field.name} String @id${type ? ` ${type}` : ""}`,
  ].join("\n");
}

function writeField(props: {
  dbms: "postgres" | "sqlite";
  field: AutoBePrisma.IPlainField;
}): string {
  const logical: string = LOGICAL_TYPES[props.field.type];
  const physical: string | undefined =
    props.dbms === "postgres"
      ? POSTGRES_PHYSICAL_TYPES[
          props.field.type as keyof typeof POSTGRES_PHYSICAL_TYPES
        ]
      : undefined;
  return [
    writeComment(props.field.description),
    [
      props.field.name,
      `${logical}${props.field.nullable ? "?" : ""}`,
      ...(physical ? [physical] : []),
    ].join(" "),
  ].join("\n");
}

/* -----------------------------------------------------------
  RELATIONS
----------------------------------------------------------- */
function writeRelations(props: {
  dbms: "postgres" | "sqlite";
  application: AutoBePrisma.IApplication;
  model: AutoBePrisma.IModel;
}): string[] {
  interface IHasRelationship {
    modelName: string;
    unique: boolean;
    mappingName?: string;
  }
  const hasRelationships: IHasRelationship[] = props.application.files
    .map((otherFile) =>
      otherFile.models.map((otherModel) =>
        otherModel.foreignFields
          .filter(
            (otherForeign) =>
              otherForeign.relation.targetModel === props.model.name,
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
    props.model.foreignFields.filter((f) => {
      if (f.unique === true)
        return props.model.uniqueIndexes.every(
          (u) => u.fieldNames.length !== 1 || u.fieldNames[0] !== f.name,
        );
      return (
        props.model.uniqueIndexes.every((u) => u.fieldNames[0] !== f.name) &&
        props.model.plainIndexes.every((p) => p.fieldNames[0] !== f.name)
      );
    });
  const contents: string[][] = [
    props.model.foreignFields.map(writeConstraint),
    hasRelationships.map((r) =>
      [
        r.mappingName ?? r.modelName,
        `${r.modelName}${r.unique ? "?" : "[]"}`,
        ...(r.mappingName ? [`@relation("${r.mappingName}")`] : []),
      ].join(" "),
    ),
    foreignIndexes.map(writeForeignIndex),
    [
      ...props.model.uniqueIndexes.map(writeUniqueIndex),
      ...props.model.plainIndexes.map(writePlainIndex),
      ...(props.dbms === "postgres"
        ? props.model.ginIndexes.map(writeGinIndex)
        : []),
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
const POSTGRES_PHYSICAL_TYPES = {
  int: "@db.Integer",
  double: "@db.DoublePrecision",
  uuid: "@db.Uuid",
  datetime: "@db.Timestamptz",
  uri: "@db.VarChar(80000)",
};

const POSTGRES_MAIN_FILE = StringUtil.trim`
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
`;
const SQLITE_MAIN_FILE = StringUtil.trim`
  generator client {
    provider = "prisma-client-js"
  }
  datasource db {
    provider = "sqlite"
    url      = "file:../../data.db"
  }
  generator markdown {
    provider = "prisma-markdown"
    output   = "../docs/ERD.md"
  }
`;
