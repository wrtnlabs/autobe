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
exports.ComplexityEvaluator = void 0;
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs"));
const base_1 = require("../base");
const types_1 = require("../../types");
class ComplexityEvaluator extends base_1.BaseEvaluator {
    name = 'ComplexityEvaluator';
    phase = 'quality';
    description = 'Checks cyclomatic complexity of functions';
    MAX_COMPLEXITY = 20;
    WARNING_COMPLEXITY = 15;
    async evaluate(context) {
        const startTime = performance.now();
        const results = await Promise.all(context.files.typescript.map(filePath => this.analyzeFile(filePath)));
        const issues = results.flatMap(r => r.issues);
        const maxComplexity = Math.max(0, ...results.map(r => r.maxComplexity));
        const totalFunctions = results.reduce((sum, r) => sum + r.functionCount, 0);
        const complexFunctions = issues.filter(i => i.severity === 'critical').length;
        return {
            phase: 'quality',
            passed: true,
            score: this.calculateScore(issues),
            maxScore: 100,
            weightedScore: this.calculateScore(issues) * 0.3,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                totalFunctions,
                complexFunctions,
                maxComplexity,
                maxComplexityThreshold: this.MAX_COMPLEXITY,
            },
        };
    }
    async analyzeFile(filePath) {
        let content;
        try {
            content = await fs.promises.readFile(filePath, 'utf-8');
        }
        catch {
            return { issues: [], maxComplexity: 0, functionCount: 0 };
        }
        const issues = [];
        let maxComplexity = 0;
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
        const visit = (node) => {
            const isFunction = ts.isFunctionDeclaration(node) ||
                ts.isMethodDeclaration(node) ||
                ts.isArrowFunction(node) ||
                ts.isFunctionExpression(node);
            if (!isFunction) {
                ts.forEachChild(node, visit);
                return;
            }
            const complexity = this.calculateComplexity(node);
            const name = this.getFunctionName(node);
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            if (complexity > maxComplexity)
                maxComplexity = complexity;
            if (complexity > this.MAX_COMPLEXITY) {
                issues.push((0, types_1.createIssue)({
                    severity: 'critical',
                    category: 'complexity',
                    code: 'C001',
                    message: `Function "${name}" has complexity ${complexity} (max: ${this.MAX_COMPLEXITY})`,
                    location: { file: filePath, line: line + 1 },
                    suggestion: 'Consider breaking this function into smaller functions',
                }));
            }
            else if (complexity > this.WARNING_COMPLEXITY) {
                issues.push((0, types_1.createIssue)({
                    severity: 'warning',
                    category: 'complexity',
                    code: 'C002',
                    message: `Function "${name}" has complexity ${complexity} (recommended: ${this.WARNING_COMPLEXITY})`,
                    location: { file: filePath, line: line + 1 },
                    suggestion: 'Consider simplifying this function',
                }));
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return { issues, maxComplexity, functionCount: this.countFunctions(content) };
    }
    calculateComplexity(node) {
        let complexity = 1;
        const visit = (child) => {
            switch (child.kind) {
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.ConditionalExpression:
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.CatchClause:
                case ts.SyntaxKind.CaseClause:
                case ts.SyntaxKind.BarBarToken:
                case ts.SyntaxKind.AmpersandAmpersandToken:
                case ts.SyntaxKind.QuestionQuestionToken:
                    complexity++;
                    break;
            }
            ts.forEachChild(child, visit);
        };
        ts.forEachChild(node, visit);
        return complexity;
    }
    getFunctionName(node) {
        if (ts.isFunctionDeclaration(node) && node.name)
            return node.name.text;
        if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name))
            return node.name.text;
        if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
            const parent = node.parent;
            if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name))
                return parent.name.text;
            if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name))
                return parent.name.text;
        }
        return '<anonymous>';
    }
    countFunctions(content) {
        const sourceFile = ts.createSourceFile('temp.ts', content, ts.ScriptTarget.Latest, true);
        let count = 0;
        const visit = (node) => {
            if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node))
                count++;
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return count;
    }
}
exports.ComplexityEvaluator = ComplexityEvaluator;
//# sourceMappingURL=complexity.evaluator.js.map