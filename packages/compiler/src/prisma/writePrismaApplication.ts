import { AutoBePrisma } from "@autobe/interface";
import { MapUtil, StringUtil } from "@autobe/utils";
import crypto from "crypto";

import { ArrayUtil } from "../utils/ArrayUtil";

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
      80,
    ),
    `model ${props.model.name} {`,
    addIndent(
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
      for (const ff of array)
        ff.relation.mappingName = shortName(`${model.name}_of_${ff.name}`);
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
    writeComment(props.field.description, 78),
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
    writeComment(props.field.description, 78),
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
    props.model.foreignFields.map((foreign) =>
      writeConstraint({
        dbms: props.dbms,
        model: props.model,
        foreign,
      }),
    ),
    hasRelationships.map((r) =>
      [
        r.mappingName ?? r.modelName,
        `${r.modelName}${r.unique ? "?" : "[]"}`,
        ...(r.mappingName ? [`@relation("${r.mappingName}")`] : []),
      ].join(" "),
    ),
    foreignIndexes.map((field) =>
      writeForeignIndex({
        model: props.model,
        field,
      }),
    ),
    [
      ...props.model.uniqueIndexes.map((unique) =>
        writeUniqueIndex({
          model: props.model,
          unique,
        }),
      ),
      ...props.model.plainIndexes.map((plain) =>
        writePlainIndex({
          model: props.model,
          plain,
        }),
      ),
      ...(props.dbms === "postgres"
        ? props.model.ginIndexes.map((gin) =>
            writeGinIndex({
              model: props.model,
              gin,
            }),
          )
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

function writeConstraint(props: {
  dbms: "postgres" | "sqlite";
  model: AutoBePrisma.IModel;
  foreign: AutoBePrisma.IForeignField;
}): string {
  // spellchecker:ignore-next-line
  const name: string = `${props.model.name}_${props.foreign.name}_rela`;
  return [
    props.foreign.relation.name,
    `${props.foreign.relation.targetModel}${props.foreign.nullable ? "?" : ""}`,
    `@relation(${[
      ...(props.foreign.relation.mappingName
        ? [`"${props.foreign.relation.mappingName}"`]
        : []),
      `fields: [${props.foreign.name}]`,
      `references: [id]`,
      `onDelete: Cascade`,
      ...(props.dbms === "sqlite" || name.length <= MAX_IDENTIFIER_LENGTH
        ? []
        : [`map: "${shortName(name)}"`]),
    ].join(", ")})`,
  ].join(" ");
}

function writeForeignIndex(props: {
  model: AutoBePrisma.IModel;
  field: AutoBePrisma.IForeignField;
}): string {
  const name: string = `${props.model.name}_${props.field.name}_fkey`;
  const prefix: string = `@@${props.field.unique === true ? "unique" : "index"}([${props.field.name}]`;
  if (name.length <= MAX_IDENTIFIER_LENGTH) return `${prefix})`;
  return `${prefix}, map: "${shortName(name)}")`;
}

function writeUniqueIndex(props: {
  model: AutoBePrisma.IModel;
  unique: AutoBePrisma.IUniqueIndex;
}): string {
  const name: string = `${props.model.name}_${props.unique.fieldNames.join("_")}_key`;
  const prefix: string = `@@unique([${props.unique.fieldNames.join(", ")}]`;
  if (name.length <= MAX_IDENTIFIER_LENGTH) return `${prefix})`;
  return `${prefix}, map: "${shortName(name)}")`;
}

function writePlainIndex(props: {
  model: AutoBePrisma.IModel;
  plain: AutoBePrisma.IPlainIndex;
}): string {
  const name: string = `${props.model.name}_${props.plain.fieldNames.join("_")}_idx`;
  const prefix: string = `@@index([${props.plain.fieldNames.join(", ")}]`;
  if (name.length <= MAX_IDENTIFIER_LENGTH) return `${prefix})`;
  return `${prefix}, map: "${shortName(name)}")`;
}

function writeGinIndex(props: {
  model: AutoBePrisma.IModel;
  gin: AutoBePrisma.IGinIndex;
}): string {
  const name: string = `${props.model.name}_${props.gin.fieldName}_idx`;
  const prefix: string = `@@index([${props.gin.fieldName}(ops: raw("gin_trgm_ops"))], type: Gin`;
  if (name.length <= MAX_IDENTIFIER_LENGTH) return `${prefix})`;
  return `${prefix}, map: "${shortName(name)}")`;
}

/* -----------------------------------------------------------
  BACKGROUND
----------------------------------------------------------- */
function writeComment(content: string, length: number): string {
  return content
    .split("\r\n")
    .join("\n")
    .split("\n")
    .map((line) => line.trim())
    .map((line) => {
      // 77자에서 "/// " 4자를 뺀 73자가 실제 컨텐츠 최대 길이
      if (line.length <= length - 4) return [line];
      const words: string[] = line.split(" ");
      const result: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const potentialLine = currentLine ? `${currentLine} ${word}` : word;
        if (potentialLine.length <= 73) {
          currentLine = potentialLine;
        } else {
          if (currentLine) result.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) result.push(currentLine);
      return result;
    })
    .flat()
    .map((str) => `///${str.length ? ` ${str}` : ""}`)
    .join("\n")
    .trim();
}

function addIndent(content: string): string {
  return content
    .split("\r\n")
    .join("\n")
    .split("\n")
    .map((str) => `  ${str}`)
    .join("\n");
}

function shortName(name: string): string {
  if (name.length <= MAX_IDENTIFIER_LENGTH) return name;
  const hash: string = crypto
    .createHash("md5")
    .update(name)
    .digest("hex")
    .substring(0, HASH_TRUNCATION_LENGTH);
  return `${name.substring(0, MAX_IDENTIFIER_LENGTH - HASH_TRUNCATION_LENGTH - 1)}_${hash}`;
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
    engineType      = "client"
    previewFeatures = ["postgresqlExtensions", "views"]
  }
  datasource db {
    provider   = "postgresql"
    url        = env("DATABASE_URL")
    extensions = [pg_trgm]
  }
  generator markdown {
    provider = "prisma-markdown"
    output   = "../../docs/ERD.md"
  }
`;
const SQLITE_MAIN_FILE = StringUtil.trim`
  generator client {
    provider   = "prisma-client-js"
    engineType = "client"
  }
  datasource db {
    provider = "sqlite"
    url      = "file:../db.sqlite"
  }
  generator markdown {
    provider = "prisma-markdown"
    output   = "../../docs/ERD.md"
  }
`;
const MAX_IDENTIFIER_LENGTH = 63;
const HASH_TRUNCATION_LENGTH = 8;
