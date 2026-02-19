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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const compiler_1 = require("@autobe/compiler");
const base_1 = require("../base");
const types_1 = require("../../types");
/**
 * Type Evaluator
 * Checks TypeScript type errors using AutoBeTypeScriptCompiler (in-memory)
 */
class TypeEvaluator extends base_1.GateEvaluator {
    name = 'TypeEvaluator';
    description = 'Checks TypeScript type errors using in-memory compiler';
    async checkGate(context) {
        if (context.files.typescript.length === 0) {
            return {
                passed: true,
                issues: [],
                metrics: { skipped: true, reason: 'No TypeScript files found' },
            };
        }
        // Read all TypeScript files into Record<string, string>
        const tsFiles = await this.readFilesAsRecord([
            ...context.files.controllers,
            ...context.files.providers,
            ...context.files.structures,
            ...context.files.tests,
        ], context.project.rootPath);
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
                        severity: 'critical',
                        category: 'type-error',
                        code: 'T001',
                        message: `TypeScript compilation exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    }),
                ],
                metrics: { typeErrorCount: 1 },
            };
        }
    }
    mapCompileResult(result) {
        if (result.type === 'success') {
            return {
                passed: true,
                issues: [],
                metrics: { typeErrorCount: 0 },
            };
        }
        if (result.type === 'exception') {
            return {
                passed: false,
                issues: [
                    (0, types_1.createIssue)({
                        severity: 'critical',
                        category: 'type-error',
                        code: 'T001',
                        message: `TypeScript compilation exception: ${String(result.error)}`,
                    }),
                ],
                metrics: { typeErrorCount: 1 },
            };
        }
        // type === 'failure'
        const issues = result.diagnostics.map((diag) => (0, types_1.createIssue)({
            severity: diag.category === 'error' ? 'critical' : 'warning',
            category: 'type-error',
            code: `TS${diag.code}`,
            message: diag.messageText,
            location: diag.file
                ? { file: diag.file, line: diag.start ?? 0 }
                : undefined,
        }));
        const criticalCount = issues.filter((i) => i.severity === 'critical').length;
        return {
            passed: criticalCount === 0,
            issues,
            metrics: { typeErrorCount: issues.length },
        };
    }
    async readFilesAsRecord(filePaths, rootPath) {
        const entries = await Promise.all(filePaths.map(async (filePath) => {
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
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