import { AutoBeTypeScriptCompiler } from "@autobe/compiler";
import type { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue } from "../../types";
import { createIssue } from "../../types";
import { GateCheckResult, GateEvaluator } from "../base";
import { classifyDiagnostic } from "./classify";

/** Prisma type → TypeScript type mapping */
const PRISMA_TYPE_MAP: Record<string, string> = {
  String: "string",
  Int: "number",
  BigInt: "bigint",
  Float: "number",
  Decimal: "number",
  Boolean: "boolean",
  DateTime: "Date",
  Json: "Record<string, unknown>",
  Bytes: "Buffer",
};

interface ParsedField {
  name: string;
  type: string;
  isArray: boolean;
  isOptional: boolean;
}

interface ParsedModel {
  name: string;
  fields: ParsedField[];
}

interface ParsedEnum {
  name: string;
  values: string[];
}

/**
 * Type Evaluator Checks TypeScript type errors using AutoBeTypeScriptCompiler
 * (in-memory)
 */
export class TypeEvaluator extends GateEvaluator {
  readonly name = "TypeEvaluator";
  readonly description =
    "Checks TypeScript type errors using in-memory compiler";

  async checkGate(context: EvaluationContext): Promise<GateCheckResult> {
    if (context.files.typescript.length === 0) {
      return {
        passed: true,
        issues: [],
        metrics: { skipped: true, reason: "No TypeScript files found" },
      };
    }

    // Read all TypeScript files (including decorators, utils, guards, etc.)
    const tsFiles = await this.readFilesAsRecord(
      context.files.typescript,
      context.project.rootPath,
    );

    // Inject prisma client stub if the project uses Prisma but lacks client.ts
    const prismaClientKey = path.join("src", "prisma", "client.ts");
    if (!tsFiles[prismaClientKey] && context.files.prismaSchemas.length > 0) {
      tsFiles[prismaClientKey] = this.generatePrismaStub(
        context.files.prismaSchemas,
      );
    }

    // Do NOT pass raw .prisma files to the TypeScript compiler — they cause
    // TS6054 (unsupported extension) and ESLint parse errors. The Prisma client
    // stub generated above provides all necessary type information instead.

    try {
      const compiler = new AutoBeTypeScriptCompiler();
      const result = await compiler.compile({
        files: tsFiles,
      });

      return this.mapCompileResult(result);
    } catch (error) {
      return {
        passed: false,
        issues: [
          createIssue({
            severity: "critical",
            category: "type-error",
            code: "T001",
            message: `TypeScript compilation exception: ${error instanceof Error ? error.message : "Unknown error"}`,
          }),
        ],
        metrics: { typeErrorCount: 1 },
      };
    }
  }

  private mapCompileResult(
    result: IAutoBeTypeScriptCompileResult,
  ): GateCheckResult {
    if (result.type === "success") {
      return {
        passed: true,
        issues: [],
        metrics: { typeErrorCount: 0 },
      };
    }

    if (result.type === "exception") {
      return {
        passed: false,
        issues: [
          createIssue({
            severity: "critical",
            category: "type-error",
            code: "T001",
            message: `TypeScript compilation exception: ${String(result.error)}`,
          }),
        ],
        metrics: { typeErrorCount: 1 },
      };
    }

    // type === 'failure'
    const issues: Issue[] = result.diagnostics.map((diag) =>
      createIssue({
        severity:
          diag.category === "error"
            ? classifyDiagnostic(Number(diag.code))
            : "suggestion",
        category: "type-error",
        code: `TS${diag.code}`,
        message: diag.messageText,
        location: diag.file
          ? { file: diag.file, line: diag.start ?? 0 }
          : undefined,
      }),
    );

    const criticalCount = issues.filter(
      (i) => i.severity === "critical",
    ).length;

    return {
      passed: criticalCount === 0,
      issues,
      metrics: { typeErrorCount: issues.length },
    };
  }

  /**
   * Parse Prisma schema files and extract model definitions with typed fields.
   * Uses brace-counting instead of `[^}]+` regex because JSDoc comments like
   * `{@link Foo.id}` contain `}` that would prematurely end the match.
   */
  private parsePrismaModels(schemaFiles: string[]): ParsedModel[] {
    const models: ParsedModel[] = [];

    for (const schemaFile of schemaFiles) {
      let content: string;
      try {
        content = fs.readFileSync(schemaFile, "utf-8");
      } catch {
        continue;
      }

      // Find model declarations and extract body via brace-counting
      const modelStartRegex = /^model\s+(\w+)\s*\{/gm;
      let startMatch: RegExpExecArray | null;

      while ((startMatch = modelStartRegex.exec(content)) !== null) {
        const modelName = startMatch[1];
        const bodyStart = startMatch.index + startMatch[0].length;

        // Brace-count to find the matching closing brace
        let depth = 1;
        let i = bodyStart;
        while (i < content.length && depth > 0) {
          if (content[i] === "{") depth++;
          else if (content[i] === "}") depth--;
          i++;
        }
        if (depth !== 0) continue;

        const modelBody = content.substring(bodyStart, i - 1);
        const fields: ParsedField[] = [];

        for (const line of modelBody.split("\n")) {
          const trimmed = line.trim();
          // Skip empty lines, comments (// and ///), and @@ directives
          if (
            !trimmed ||
            trimmed.startsWith("//") ||
            trimmed.startsWith("@@")
          ) {
            continue;
          }

          // Parse: fieldName Type[]? @attributes...
          const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)(\[\])?\s*(\?)?/);
          if (!fieldMatch) continue;

          const [, fieldName, typeName, arrayMarker, optionalMarker] =
            fieldMatch;

          // Skip Prisma directives that look like fields
          if (fieldName === "model" || fieldName === "enum") continue;

          fields.push({
            name: fieldName,
            type: typeName,
            isArray: arrayMarker === "[]",
            isOptional: optionalMarker === "?",
          });
        }

        models.push({ name: modelName, fields });
      }
    }

    return models;
  }

  /**
   * Parse Prisma schema files and extract enum definitions. Uses brace-counting
   * for consistency with parsePrismaModels.
   */
  private parsePrismaEnums(schemaFiles: string[]): ParsedEnum[] {
    const enums: ParsedEnum[] = [];

    for (const schemaFile of schemaFiles) {
      let content: string;
      try {
        content = fs.readFileSync(schemaFile, "utf-8");
      } catch {
        continue;
      }

      const enumStartRegex = /^enum\s+(\w+)\s*\{/gm;
      let startMatch: RegExpExecArray | null;

      while ((startMatch = enumStartRegex.exec(content)) !== null) {
        const enumName = startMatch[1];
        const bodyStart = startMatch.index + startMatch[0].length;

        let depth = 1;
        let i = bodyStart;
        while (i < content.length && depth > 0) {
          if (content[i] === "{") depth++;
          else if (content[i] === "}") depth--;
          i++;
        }
        if (depth !== 0) continue;

        const enumBody = content.substring(bodyStart, i - 1);
        const values: string[] = [];

        for (const line of enumBody.split("\n")) {
          const trimmed = line.trim();
          if (
            !trimmed ||
            trimmed.startsWith("//") ||
            trimmed.startsWith("@@")
          ) {
            continue;
          }
          // Enum values are simple identifiers
          const valueMatch = trimmed.match(/^(\w+)/);
          if (valueMatch) {
            values.push(valueMatch[1]);
          }
        }

        if (values.length > 0) {
          enums.push({ name: enumName, values });
        }
      }
    }

    return enums;
  }

  /** Resolve a Prisma field type to a TypeScript type string. */
  private resolveFieldType(
    field: ParsedField,
    modelNames: Set<string>,
    enumNames: Set<string>,
  ): string {
    const tsType = PRISMA_TYPE_MAP[field.type];
    let baseType: string;

    if (tsType) {
      baseType = tsType;
    } else if (modelNames.has(field.type)) {
      baseType = field.type;
    } else if (enumNames.has(field.type)) {
      baseType = field.type;
    } else {
      // Unknown type (e.g. Unsupported, composite types) — use 'any' to avoid
      // false type errors from incorrect type assumptions. 'string' caused TS
      // errors when code accessed properties on relation-like fields.
      baseType = "any";
    }

    if (field.isArray) {
      baseType = `${baseType}[]`;
    }

    if (field.isOptional) {
      baseType = `${baseType} | null`;
    }

    return baseType;
  }

  /**
   * Generate a Prisma client stub from schema files.
   *
   * AutoBE projects import from `@prisma/sdk` which maps to
   * `src/prisma/client.ts`, but this file is not generated during the realize
   * phase. We parse model definitions from `.prisma` schemas and build typed
   * stubs so the TypeScript compiler can resolve imports properly.
   */
  private generatePrismaStub(schemaFiles: string[]): string {
    const models = this.parsePrismaModels(schemaFiles);
    const enums = this.parsePrismaEnums(schemaFiles);
    const modelNames = new Set(models.map((m) => m.name));
    const enumNames = new Set(enums.map((e) => e.name));

    const lines: string[] = [
      "// Auto-generated Prisma client stub for type evaluation",
      "// Built from schema model definitions",
      "",
    ];

    // Generate enum types
    for (const enumDef of enums) {
      lines.push(`export enum ${enumDef.name} {`);
      for (const value of enumDef.values) {
        lines.push(`  ${value} = "${value}",`);
      }
      lines.push("}", "");
    }

    // Generate model interfaces with typed fields
    for (const model of models) {
      lines.push(`export interface ${model.name} {`);
      for (const field of model.fields) {
        const tsType = this.resolveFieldType(field, modelNames, enumNames);
        lines.push(`  ${field.name}: ${tsType};`);
      }
      lines.push("}", "");
    }

    // PrismaClient class with typed model delegates
    lines.push("export declare class PrismaClient {");
    for (const model of models) {
      lines.push(`  ${model.name}: PrismaDelegate<${model.name}>;`);
    }
    lines.push(
      "  $transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;",
      "  $connect(): Promise<void>;",
      "  $disconnect(): Promise<void>;",
      "}",
      "",
    );

    // TransactionClient type
    lines.push(
      "type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$transaction'>;",
      "",
    );

    // PrismaDelegate with standard CRUD methods
    lines.push(
      "interface PrismaFindArgs {",
      "  where?: Record<string, unknown>;",
      "  orderBy?: Record<string, unknown> | Record<string, unknown>[];",
      "  skip?: number;",
      "  take?: number;",
      "  cursor?: Record<string, unknown>;",
      "  select?: Record<string, unknown>;",
      "  include?: Record<string, unknown>;",
      "  distinct?: string[];",
      "  _count?: boolean | Record<string, unknown>;",
      "  _avg?: Record<string, unknown>;",
      "  _sum?: Record<string, unknown>;",
      "  _min?: Record<string, unknown>;",
      "  _max?: Record<string, unknown>;",
      "}",
      "",
      "interface PrismaMutateArgs {",
      "  where?: Record<string, unknown>;",
      "  data?: Record<string, unknown>;",
      "  create?: Record<string, unknown>;",
      "  update?: Record<string, unknown>;",
      "  select?: Record<string, unknown>;",
      "  include?: Record<string, unknown>;",
      "}",
      "",
      "interface PrismaDelegate<T> {",
      "  findMany(args?: PrismaFindArgs): Promise<T[]>;",
      "  findFirst(args?: PrismaFindArgs): Promise<T | null>;",
      "  findFirstOrThrow(args?: PrismaFindArgs): Promise<T>;",
      "  findUnique(args?: PrismaFindArgs): Promise<T | null>;",
      "  findUniqueOrThrow(args?: PrismaFindArgs): Promise<T>;",
      "  create(args: PrismaMutateArgs): Promise<T>;",
      "  createMany(args: PrismaMutateArgs): Promise<{ count: number }>;",
      "  update(args: PrismaMutateArgs): Promise<T>;",
      "  updateMany(args: PrismaMutateArgs): Promise<{ count: number }>;",
      "  upsert(args: PrismaMutateArgs): Promise<T>;",
      "  delete(args: PrismaMutateArgs): Promise<T>;",
      "  deleteMany(args?: PrismaFindArgs): Promise<{ count: number }>;",
      "  count(args?: PrismaFindArgs): Promise<number>;",
      "  aggregate(args: PrismaFindArgs): Promise<Record<string, unknown>>;",
      "  groupBy(args: PrismaFindArgs): Promise<Record<string, unknown>[]>;",
      "}",
      "",
    );

    // Prisma namespace with utility types
    lines.push(
      "export declare namespace Prisma {",
      "  export type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$transaction'>;",
      "  export type PrismaPromise<T> = Promise<T>;",
      "  export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };",
      "  export type InputJsonValue = string | number | boolean | null | InputJsonValue[] | { [key: string]: InputJsonValue };",
      "",
      "  // Value exports for runtime usage",
      "  export const QueryMode: { default: string; insensitive: string };",
      "  export const SortOrder: { asc: string; desc: string };",
      "  export class PrismaClientKnownRequestError extends Error { code: string; meta?: Record<string, unknown>; }",
      "  export class PrismaClientUnknownRequestError extends Error {}",
      "  export class PrismaClientValidationError extends Error {}",
      "",
    );

    // Per-model utility types
    for (const model of models) {
      lines.push(
        `  export type ${model.name}GetPayload<T = unknown> = ${model.name};`,
        `  export type ${model.name}CreateInput = Record<string, unknown>;`,
        `  export type ${model.name}UpdateInput = Record<string, unknown>;`,
        `  export type ${model.name}WhereInput = Record<string, unknown>;`,
        `  export type ${model.name}WhereUniqueInput = Record<string, unknown>;`,
        `  export type ${model.name}OrderByWithRelationInput = Record<string, unknown>;`,
        `  export type ${model.name}Select = Record<string, unknown>;`,
        `  export type ${model.name}Include = Record<string, unknown>;`,
        `  export type ${model.name}FindManyArgs = PrismaFindArgs;`,
        `  export type ${model.name}FindFirstArgs = PrismaFindArgs;`,
        `  export type ${model.name}FindUniqueArgs = PrismaFindArgs;`,
        `  export type ${model.name}CreateArgs = PrismaMutateArgs;`,
        `  export type ${model.name}UpdateArgs = PrismaMutateArgs;`,
        `  export type ${model.name}DeleteArgs = PrismaMutateArgs;`,
        `  export type ${model.name}CountArgs = PrismaFindArgs;`,
        `  export type ${model.name}AggregateArgs = PrismaFindArgs;`,
        `  export type ${model.name}GroupByArgs = PrismaFindArgs;`,
      );
    }

    lines.push("}", "", "export default PrismaClient;");

    return lines.join("\n");
  }
}
