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
exports.JsDocEvaluator = void 0;
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs"));
const base_1 = require("../base");
const types_1 = require("../../types");
class JsDocEvaluator extends base_1.BaseEvaluator {
    name = 'JsDocEvaluator';
    phase = 'quality';
    description = 'Checks for JSDoc comments';
    async evaluate(context) {
        const startTime = performance.now();
        const filesToCheck = [
            ...context.files.controllers,
            ...context.files.structures,
        ];
        const results = await Promise.all(filesToCheck.map(filePath => this.analyzeFile(filePath)));
        const issues = results.flatMap(r => r.issues);
        const totalPublicApis = results.reduce((sum, r) => sum + r.totalApis, 0);
        const documentedApis = results.reduce((sum, r) => sum + r.documentedApis, 0);
        const coverage = totalPublicApis > 0 ? (documentedApis / totalPublicApis) * 100 : 100;
        const score = Math.round(coverage);
        return {
            phase: 'quality',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.3,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                totalPublicApis,
                documentedApis,
                coverage: Math.round(coverage),
            },
        };
    }
    async analyzeFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const issues = [];
            let totalApis = 0;
            let documentedApis = 0;
            const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
            const visit = (node) => {
                if (ts.isClassDeclaration(node) && node.name) {
                    totalApis++;
                    if (this.hasJsDoc(node, sourceFile)) {
                        documentedApis++;
                    }
                    else {
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        issues.push((0, types_1.createIssue)({
                            severity: 'suggestion',
                            category: 'jsdoc',
                            code: 'J001',
                            message: `Class "${node.name.text}" missing JSDoc`,
                            location: { file: filePath, line: line + 1 },
                        }));
                    }
                }
                if (ts.isInterfaceDeclaration(node) && node.name) {
                    totalApis++;
                    if (this.hasJsDoc(node, sourceFile)) {
                        documentedApis++;
                    }
                    else {
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        issues.push((0, types_1.createIssue)({
                            severity: 'suggestion',
                            category: 'jsdoc',
                            code: 'J002',
                            message: `Interface "${node.name.text}" missing JSDoc`,
                            location: { file: filePath, line: line + 1 },
                        }));
                    }
                }
                ts.forEachChild(node, visit);
            };
            visit(sourceFile);
            return { issues, totalApis, documentedApis };
        }
        catch {
            return { issues: [], totalApis: 0, documentedApis: 0 };
        }
    }
    hasJsDoc(node, sourceFile) {
        const text = sourceFile.getFullText();
        const nodeStart = node.getFullStart();
        const leadingComments = ts.getLeadingCommentRanges(text, nodeStart);
        if (!leadingComments)
            return false;
        return leadingComments.some(comment => {
            const commentText = text.slice(comment.pos, comment.end);
            return commentText.startsWith('/**');
        });
    }
}
exports.JsDocEvaluator = JsDocEvaluator;
//# sourceMappingURL=jsdoc.evaluator.js.map