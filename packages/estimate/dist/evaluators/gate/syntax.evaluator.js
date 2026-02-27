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
exports.SyntaxEvaluator = void 0;
const fs = __importStar(require("fs"));
const ts = __importStar(require("typescript"));
const types_1 = require("../../types");
const base_1 = require("../base");
const classify_1 = require("./classify");
/** Syntax Evaluator Checks TypeScript syntax errors using the compiler API */
class SyntaxEvaluator extends base_1.GateEvaluator {
    name = "SyntaxEvaluator";
    description = "Checks TypeScript syntax errors";
    async checkGate(context) {
        const results = await Promise.all(context.files.typescript.map((filePath) => this.checkFile(filePath)));
        const issues = results.flatMap((r) => r.issues);
        const filesWithErrors = results.filter((r) => r.hasError).length;
        return {
            passed: issues.filter((i) => i.severity === "critical").length === 0,
            issues,
            metrics: {
                totalFiles: context.files.typescript.length,
                filesWithErrors,
                syntaxErrorCount: issues.length,
            },
        };
    }
    async checkFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const issues = this.checkSyntax(filePath, content);
            return { issues, hasError: issues.length > 0 };
        }
        catch (error) {
            return {
                issues: [
                    (0, types_1.createIssue)({
                        severity: "critical",
                        category: "syntax-error",
                        code: "E001",
                        message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
                        location: { file: filePath, line: 1 },
                        autoFixable: false,
                    }),
                ],
                hasError: true,
            };
        }
    }
    checkSyntax(filePath, content) {
        const issues = [];
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const diagnostics = this.getSyntaxDiagnostics(sourceFile);
        for (const diagnostic of diagnostics) {
            const { line, character } = diagnostic.file
                ? ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start || 0)
                : { line: 0, character: 0 };
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            issues.push((0, types_1.createIssue)({
                severity: (0, classify_1.classifyDiagnostic)(diagnostic.code),
                category: "syntax-error",
                code: `TS${diagnostic.code}`,
                message,
                location: {
                    file: filePath,
                    line: line + 1,
                    column: character + 1,
                },
                autoFixable: false,
            }));
        }
        return issues;
    }
    getSyntaxDiagnostics(sourceFile) {
        const compilerHost = {
            getSourceFile: (fileName) => fileName === sourceFile.fileName ? sourceFile : undefined,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => { },
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === sourceFile.fileName,
            readFile: () => "",
        };
        const program = ts.createProgram([sourceFile.fileName], { noEmit: true, allowJs: true }, compilerHost);
        return [...program.getSyntacticDiagnostics(sourceFile)];
    }
}
exports.SyntaxEvaluator = SyntaxEvaluator;
//# sourceMappingURL=syntax.evaluator.js.map