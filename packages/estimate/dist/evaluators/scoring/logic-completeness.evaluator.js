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
exports.LogicCompletenessEvaluator = void 0;
const fs = __importStar(require("fs"));
const types_1 = require("../../types");
const base_1 = require("../base");
class LogicCompletenessEvaluator extends base_1.BaseEvaluator {
    name = "LogicCompletenessEvaluator";
    phase = "logicCompleteness";
    description = "Checks for incomplete implementations";
    INCOMPLETE_PATTERNS = [
        {
            pattern: /throw\s+new\s+Error\s*\(\s*['"`]not\s*implemented['"`]\s*\)/gi,
            code: "LOGIC001",
            message: 'Unimplemented code: throw new Error("not implemented")',
        },
        {
            pattern: /\/\/\s*TODO\s*:/gi,
            code: "LOGIC002",
            message: "TODO comment found",
        },
        {
            pattern: /\/\/\s*FIXME\s*:/gi,
            code: "LOGIC003",
            message: "FIXME comment found (indicates known bug)",
        },
        {
            pattern: /\/\/\s*HACK\s*:/gi,
            code: "LOGIC004",
            message: "HACK comment found",
        },
        {
            pattern: /\/\/\s*implement\s*this/gi,
            code: "LOGIC005",
            message: "Unimplemented placeholder found",
        },
        {
            pattern: /throw\s+new\s+Error\s*\(\s*['"`]TODO['"`]\s*\)/gi,
            code: "LOGIC006",
            message: "TODO error placeholder",
        },
        {
            pattern: /notImplemented\s*\(\s*\)/gi,
            code: "LOGIC007",
            message: "notImplemented() call found",
        },
        {
            pattern: /return\s+null\s*as\s+any/gi,
            code: "LOGIC010",
            message: "Suspicious null cast to any — likely incomplete implementation",
        },
        {
            pattern: /Promise\.resolve\s*\(\s*(?:null|undefined|\{\}|\[\])\s*\)/gi,
            code: "LOGIC011",
            message: "Stub async return — Promise resolves with empty value",
        },
        {
            pattern: /console\.log\s*\(.*(?:debug|test|temp|check)\b/gi,
            code: "LOGIC012",
            message: "Debug console.log left in production code",
        },
    ];
    async evaluate(context) {
        const startTime = performance.now();
        const filesToCheck = [
            ...context.files.controllers,
            ...context.files.providers,
        ];
        const results = await Promise.all(filesToCheck.map((filePath) => this.analyzeFile(filePath)));
        const issues = results.flatMap((r) => r);
        const criticalCount = issues.filter((i) => i.severity === "critical").length;
        const warningCount = issues.filter((i) => i.severity === "warning").length;
        let score;
        if (criticalCount === 0 && issues.length === 0) {
            score = 100;
        }
        else if (criticalCount === 0) {
            score = Math.max(70, 100 - warningCount * 2);
        }
        else if (criticalCount <= 3) {
            score = Math.max(50, 80 - criticalCount * 10);
        }
        else if (criticalCount <= 10) {
            score = Math.max(20, 50 - criticalCount * 3);
        }
        else {
            score = 0;
        }
        return {
            phase: "logicCompleteness",
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.2,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                totalIncomplete: issues.length,
                criticalCount,
                warningCount,
                todoCount: issues.filter((i) => i.code === "LOGIC002").length,
                fixmeCount: issues.filter((i) => i.code === "LOGIC003").length,
                emptyMethods: issues.filter((i) => i.code === "LOGIC008").length,
                emptyCatch: issues.filter((i) => i.code === "LOGIC009").length,
            },
        };
    }
    async analyzeFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const lines = content.split("\n");
            const issues = [];
            // Pattern-based checks (line by line)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                for (const { pattern, code, message } of this.INCOMPLETE_PATTERNS) {
                    pattern.lastIndex = 0;
                    if (pattern.test(line)) {
                        const severity = code === "LOGIC002" ? "warning" : "critical";
                        issues.push((0, types_1.createIssue)({
                            severity,
                            category: "completeness",
                            code,
                            message,
                            location: { file: filePath, line: i + 1 },
                        }));
                    }
                }
            }
            // Structural checks (full content)
            this.checkEmptyMethods(content, filePath, issues);
            this.checkEmptyCatch(content, filePath, issues);
            this.checkStubReturns(content, filePath, issues);
            return issues;
        }
        catch (error) {
            console.error(`Failed to analyze file ${filePath}:`, error);
            return [];
        }
    }
    /** Detect empty method bodies: async methodName(...) { } */
    checkEmptyMethods(content, filePath, issues) {
        const emptyMethodPattern = /(?:async\s+)?(?:\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{\s*\n?\s*\}/g;
        let match;
        while ((match = emptyMethodPattern.exec(content)) !== null) {
            const line = content.substring(0, match.index).split("\n").length;
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "completeness",
                code: "LOGIC008",
                message: "Empty method body found",
                location: { file: filePath, line },
            }));
        }
    }
    /** Detect empty catch blocks: catch (...) { } */
    checkEmptyCatch(content, filePath, issues) {
        const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\n?\s*\}/g;
        let match;
        while ((match = emptyCatchPattern.exec(content)) !== null) {
            const line = content.substring(0, match.index).split("\n").length;
            issues.push((0, types_1.createIssue)({
                severity: "warning",
                category: "completeness",
                code: "LOGIC009",
                message: "Empty catch block — errors silently swallowed",
                location: { file: filePath, line },
            }));
        }
    }
    /** Detect stub return values: return {} or return [] as only statement */
    checkStubReturns(content, filePath, issues) {
        // Match methods whose body is just `return {};` or `return [];` or `return null;`
        const stubReturnPattern = /(?:async\s+)?(?:\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{\s*return\s+(?:\{\}|\[\]|null|undefined|0|false|''|"")\s*;?\s*\}/g;
        let match;
        while ((match = stubReturnPattern.exec(content)) !== null) {
            const line = content.substring(0, match.index).split("\n").length;
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "completeness",
                code: "LOGIC010",
                message: "Stub return value — method returns empty object/array/null",
                location: { file: filePath, line },
            }));
        }
    }
}
exports.LogicCompletenessEvaluator = LogicCompletenessEvaluator;
//# sourceMappingURL=logic-completeness.evaluator.js.map