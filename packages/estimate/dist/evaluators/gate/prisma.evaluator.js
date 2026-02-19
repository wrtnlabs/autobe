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
exports.PrismaEvaluator = void 0;
const compiler_1 = require("@autobe/compiler");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../../types");
const base_1 = require("../base");
/**
 * Prisma Evaluator Validates Prisma schema using AutoBeDatabaseCompiler
 * (in-memory)
 */
class PrismaEvaluator extends base_1.GateEvaluator {
    name = "PrismaEvaluator";
    description = "Validates Prisma schema using in-memory compiler";
    async checkGate(context) {
        if (context.files.prismaSchemas.length === 0) {
            return {
                passed: true,
                issues: [],
                metrics: { skipped: true, reason: "No Prisma schemas found" },
            };
        }
        // Read all prisma schema files into Record<string, string>
        const prismaFiles = await this.readFilesAsRecord(context.files.prismaSchemas, context.project.rootPath);
        if (Object.keys(prismaFiles).length === 0) {
            return {
                passed: true,
                issues: [
                    (0, types_1.createIssue)({
                        severity: "warning",
                        category: "prisma",
                        code: "P000",
                        message: "Failed to read Prisma schema files",
                    }),
                ],
                metrics: { skipped: true },
            };
        }
        try {
            const compiler = new compiler_1.AutoBeDatabaseCompiler();
            const result = await compiler.compilePrismaSchemas({
                files: prismaFiles,
            });
            if (result.type === "success") {
                return {
                    passed: true,
                    issues: [],
                    metrics: { valid: true },
                };
            }
            // Compilation failed
            const errorMessage = result.type === "failure"
                ? result.reason.substring(0, 500)
                : "Prisma compilation exception: ${String(result.error)}";
            return {
                passed: false,
                issues: [
                    (0, types_1.createIssue)({
                        severity: "critical",
                        category: "prisma-error",
                        code: "P001",
                        message: errorMessage || "Prisma schema validation failed",
                    }),
                ],
                metrics: { valid: false },
            };
        }
        catch (error) {
            return {
                passed: false,
                issues: [
                    (0, types_1.createIssue)({
                        severity: "critical",
                        category: "prisma-error",
                        code: "P001",
                        message: `Prisma compilation exception: ${error instanceof Error ? error.message : "Unknown error"}`,
                    }),
                ],
                metrics: { valid: false },
            };
        }
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
exports.PrismaEvaluator = PrismaEvaluator;
//# sourceMappingURL=prisma.evaluator.js.map