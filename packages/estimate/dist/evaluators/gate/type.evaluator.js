"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeEvaluator = void 0;
const compiler_1 = require("@autobe/compiler");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../../types");
const base_1 = require("../base");
const classify_1 = require("./classify");
/** Prisma type → TypeScript type mapping */
const PRISMA_TYPE_MAP = {
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
/**
 * Type Evaluator Checks TypeScript type errors using AutoBeTypeScriptCompiler
 * (in-memory)
 */
class TypeEvaluator extends base_1.GateEvaluator {
    name = "TypeEvaluator";
    description = "Checks TypeScript type errors using in-memory compiler";
    async checkGate(context) {
        if (context.files.typescript.length === 0) {
            return {
                passed: true,
                issues: [],
                metrics: { skipped: true, reason: "No TypeScript files found" },
            };
        }
        // Read all TypeScript files (including decorators, utils, guards, etc.)
        const tsFiles = await this.readFilesAsRecord(context.files.typescript, context.project.rootPath);
        // Inject prisma client stub if the project uses Prisma but lacks client.ts
        const prismaClientKey = path.join("src", "prisma", "client.ts");
        if (!tsFiles[prismaClientKey] && context.files.prismaSchemas.length > 0) {
            tsFiles[prismaClientKey] = this.generatePrismaStub(context.files.prismaSchemas);
        }
        // Read Prisma schema files if available
        const prismaFiles = context.files.prismaSchemas.length > 0
            ? await this.readFilesAsRecord(context.files.prismaSchemas, context.project.rootPath)
            : undefined;
        try {
            const compiler = new compiler_1.AutoBeTypeScriptCompiler();
            const result = await compiler.compile({
                files: tsFiles,
                prisma: prismaFiles,
            });
            return this.mapCompileResult(result);
        }
        catch (error) {
            return {
                passed: false,
                issues: [
                    (0, types_1.createIssue)({
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
    mapCompileResult(result) {
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
                    (0, types_1.createIssue)({
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
        const issues = result.diagnostics.map((diag) => (0, types_1.createIssue)({
            severity: diag.category === "error"
                ? (0, classify_1.classifyDiagnostic)(Number(diag.code))
                : "suggestion",
            category: "type-error",
            code: `TS${diag.code}`,
            message: diag.messageText,
            location: diag.file
                ? { file: diag.file, line: diag.start ?? 0 }
                : undefined,
        }));
        const criticalCount = issues.filter((i) => i.severity === "critical").length;
        return {
            passed: criticalCount === 0,
            issues,
            metrics: { typeErrorCount: issues.length },
        };
    }
    /** Parse Prisma schema files and extract model definitions with typed fields. */
    parsePrismaModels(schemaFiles) {
        const models = [];
        for (const schemaFile of schemaFiles) {
            let content;
            try {
                content = fs.readFileSync(schemaFile, "utf-8");
            }
            catch {
                continue;
            }
            const modelRegex = /^model\s+(\w+)\s*\{([^}]+)\}/gm;
            let modelMatch;
            while ((modelMatch = modelRegex.exec(content)) !== null) {
                const modelName = modelMatch[1];
                const modelBody = modelMatch[2];
                const fields = [];
                for (const line of modelBody.split("\n")) {
                    const trimmed = line.trim();
                    // Skip empty lines, comments, and @@ directives
                    if (!trimmed ||
                        trimmed.startsWith("//") ||
                        trimmed.startsWith("@@")) {
                        continue;
                    }
                    // Parse: fieldName Type[]? @attributes...
                    const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)(\[\])?\s*(\?)?/);
                    if (!fieldMatch)
                        continue;
                    const [, fieldName, typeName, arrayMarker, optionalMarker] = fieldMatch;
                    // Skip Prisma directives that look like fields
                    if (fieldName === "model" || fieldName === "enum")
                        continue;
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
    /** Resolve a Prisma field type to a TypeScript type string. */
    resolveFieldType(field, modelNames) {
        const tsType = PRISMA_TYPE_MAP[field.type];
        let baseType;
        if (tsType) {
            baseType = tsType;
        }
        else if (modelNames.has(field.type)) {
            baseType = field.type;
        }
        else {
            // Unknown type (enums, custom types) — use string as safe fallback
            baseType = "string";
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
    generatePrismaStub(schemaFiles) {
        const models = this.parsePrismaModels(schemaFiles);
        const modelNames = new Set(models.map((m) => m.name));
        const lines = [
            "// Auto-generated Prisma client stub for type evaluation",
            "// Built from schema model definitions",
            "",
        ];
        // Generate model interfaces with typed fields
        for (const model of models) {
            lines.push(`export interface ${model.name} {`);
            for (const field of model.fields) {
                const tsType = this.resolveFieldType(field, modelNames);
                lines.push(`  ${field.name}: ${tsType};`);
            }
            lines.push("}", "");
        }
        // PrismaClient class with typed model delegates
        lines.push("export declare class PrismaClient {");
        for (const model of models) {
            lines.push(`  ${model.name}: PrismaDelegate<${model.name}>;`);
        }
        lines.push("  $transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;", "  $connect(): Promise<void>;", "  $disconnect(): Promise<void>;", "}", "");
        // TransactionClient type
        lines.push("type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$transaction'>;", "");
        // PrismaDelegate with standard CRUD methods
        lines.push("interface PrismaFindArgs {", "  where?: Record<string, unknown>;", "  orderBy?: Record<string, unknown> | Record<string, unknown>[];", "  skip?: number;", "  take?: number;", "  cursor?: Record<string, unknown>;", "  select?: Record<string, unknown>;", "  include?: Record<string, unknown>;", "  distinct?: string[];", "  _count?: boolean | Record<string, unknown>;", "  _avg?: Record<string, unknown>;", "  _sum?: Record<string, unknown>;", "  _min?: Record<string, unknown>;", "  _max?: Record<string, unknown>;", "}", "", "interface PrismaMutateArgs {", "  where?: Record<string, unknown>;", "  data?: Record<string, unknown>;", "  create?: Record<string, unknown>;", "  update?: Record<string, unknown>;", "  select?: Record<string, unknown>;", "  include?: Record<string, unknown>;", "}", "", "interface PrismaDelegate<T> {", "  findMany(args?: PrismaFindArgs): Promise<T[]>;", "  findFirst(args?: PrismaFindArgs): Promise<T | null>;", "  findUnique(args?: PrismaFindArgs): Promise<T | null>;", "  findUniqueOrThrow(args?: PrismaFindArgs): Promise<T>;", "  create(args: PrismaMutateArgs): Promise<T>;", "  createMany(args: PrismaMutateArgs): Promise<{ count: number }>;", "  update(args: PrismaMutateArgs): Promise<T>;", "  updateMany(args: PrismaMutateArgs): Promise<{ count: number }>;", "  upsert(args: PrismaMutateArgs): Promise<T>;", "  delete(args: PrismaMutateArgs): Promise<T>;", "  deleteMany(args?: PrismaFindArgs): Promise<{ count: number }>;", "  count(args?: PrismaFindArgs): Promise<number>;", "  aggregate(args: PrismaFindArgs): Promise<Record<string, unknown>>;", "  groupBy(args: PrismaFindArgs): Promise<Record<string, unknown>[]>;", "}", "");
        // Prisma namespace with utility types
        lines.push("export declare namespace Prisma {", "  export type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$transaction'>;", "  export type PrismaPromise<T> = Promise<T>;", "  export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };", "  export type InputJsonValue = string | number | boolean | null | InputJsonValue[] | { [key: string]: InputJsonValue };", "", "  // Value exports for runtime usage", "  export const QueryMode: { default: string; insensitive: string };", "  export const SortOrder: { asc: string; desc: string };", "  export class PrismaClientKnownRequestError extends Error { code: string; meta?: Record<string, unknown>; }", "  export class PrismaClientUnknownRequestError extends Error {}", "  export class PrismaClientValidationError extends Error {}", "");
        // Per-model utility types
        for (const model of models) {
            lines.push(`  export type ${model.name}GetPayload<T = unknown> = ${model.name};`, `  export type ${model.name}CreateInput = Record<string, unknown>;`, `  export type ${model.name}UpdateInput = Record<string, unknown>;`, `  export type ${model.name}WhereInput = Record<string, unknown>;`, `  export type ${model.name}WhereUniqueInput = Record<string, unknown>;`, `  export type ${model.name}OrderByWithRelationInput = Record<string, unknown>;`, `  export type ${model.name}Select = Record<string, unknown>;`, `  export type ${model.name}Include = Record<string, unknown>;`, `  export type ${model.name}FindManyArgs = PrismaFindArgs;`, `  export type ${model.name}FindFirstArgs = PrismaFindArgs;`, `  export type ${model.name}FindUniqueArgs = PrismaFindArgs;`, `  export type ${model.name}CreateArgs = PrismaMutateArgs;`, `  export type ${model.name}UpdateArgs = PrismaMutateArgs;`, `  export type ${model.name}DeleteArgs = PrismaMutateArgs;`, `  export type ${model.name}CountArgs = PrismaFindArgs;`, `  export type ${model.name}AggregateArgs = PrismaFindArgs;`, `  export type ${model.name}GroupByArgs = PrismaFindArgs;`);
        }
        lines.push("}", "", "export default PrismaClient;");
        return lines.join("\n");
    }
    async readFilesAsRecord(filePaths, rootPath) {
        const entries = await Promise.all(filePaths.map(async (filePath) => {
            try {
                const content = await fs.promises.readFile(filePath, "utf-8");
                const relativePath = path.relative(rootPath, filePath);
                return [relativePath, content];
            }
            catch {
                return null;
            }
        }));
        return Object.fromEntries(entries.filter((e) => e !== null));
    }
}
exports.TypeEvaluator = TypeEvaluator;
//# sourceMappingURL=type.evaluator.js.map