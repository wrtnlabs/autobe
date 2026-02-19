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
exports.NamingEvaluator = void 0;
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs"));
const base_1 = require("../base");
const types_1 = require("../../types");
class NamingEvaluator extends base_1.BaseEvaluator {
    name = 'NamingEvaluator';
    phase = 'quality';
    description = 'Checks naming conventions';
    async evaluate(context) {
        const startTime = performance.now();
        const filesToCheck = [
            ...context.files.controllers,
            ...context.files.providers,
            ...context.files.structures,
        ].filter(filePath => !this.isTestFile(filePath));
        const results = await Promise.all(filesToCheck.map(filePath => this.analyzeFile(filePath)));
        const issues = results.flatMap(r => r);
        const score = this.calculateScore(issues);
        return {
            phase: 'quality',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.3,
            issues,
            durationMs: Math.round(performance.now() - startTime),
        };
    }
    isTestFile(filePath) {
        return filePath.includes('/test/') ||
            filePath.includes('.test.') ||
            filePath.includes('.spec.') ||
            filePath.includes('test_');
    }
    async analyzeFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const issues = [];
            const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
            const visit = (node) => {
                if (ts.isClassDeclaration(node) && node.name) {
                    if (!this.isPascalCase(node.name.text)) {
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        issues.push((0, types_1.createIssue)({
                            severity: 'warning',
                            category: 'naming',
                            code: 'N001',
                            message: `Class "${node.name.text}" should be PascalCase`,
                            location: { file: filePath, line: line + 1 },
                        }));
                    }
                }
                if (ts.isInterfaceDeclaration(node) && node.name) {
                    if (!this.isPascalCase(node.name.text) && !node.name.text.startsWith('I')) {
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        issues.push((0, types_1.createIssue)({
                            severity: 'warning',
                            category: 'naming',
                            code: 'N002',
                            message: `Interface "${node.name.text}" should be PascalCase`,
                            location: { file: filePath, line: line + 1 },
                        }));
                    }
                }
                ts.forEachChild(node, visit);
            };
            visit(sourceFile);
            return issues;
        }
        catch {
            return [];
        }
    }
    isPascalCase(name) {
        return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    }
}
exports.NamingEvaluator = NamingEvaluator;
//# sourceMappingURL=naming.evaluator.js.map