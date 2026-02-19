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
exports.DocumentQualityEvaluator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const base_1 = require("../base");
const types_1 = require("../../types");
class DocumentQualityEvaluator extends base_1.BaseEvaluator {
    name = 'DocumentQualityEvaluator';
    phase = 'documentQuality';
    description = 'Evaluates documentation quality';
    async evaluate(context) {
        const issues = [];
        const startTime = performance.now();
        const docsPath = path.join(context.project.rootPath, 'docs', 'analysis');
        const readmePath = path.join(context.project.rootPath, 'README.md');
        const hasDocsFolder = fs.existsSync(docsPath);
        const hasReadme = fs.existsSync(readmePath);
        let docFiles = [];
        let totalDocLength = 0;
        // Read docs and README in parallel
        const [docsResult, readmeResult] = await Promise.all([
            this.readDocsFolder(docsPath, hasDocsFolder),
            this.readReadme(readmePath, hasReadme),
        ]);
        docFiles = docsResult.files;
        totalDocLength = docsResult.totalLength + readmeResult.length;
        // Calculate score
        let score = 0;
        if (!hasDocsFolder && !hasReadme) {
            score = 0;
            issues.push((0, types_1.createIssue)({
                severity: 'critical',
                category: 'documentation',
                code: 'DOC001',
                message: 'No documentation found (missing docs/analysis/ and README.md)',
            }));
        }
        else {
            if (hasDocsFolder)
                score += 40;
            if (hasReadme)
                score += 20;
            if (docFiles.length >= 5)
                score += 20;
            else if (docFiles.length >= 3)
                score += 15;
            else if (docFiles.length >= 1)
                score += 10;
            if (totalDocLength >= 50000)
                score += 20;
            else if (totalDocLength >= 20000)
                score += 15;
            else if (totalDocLength >= 5000)
                score += 10;
            else if (totalDocLength >= 1000)
                score += 5;
            score = Math.min(100, score);
            if (!hasDocsFolder) {
                issues.push((0, types_1.createIssue)({
                    severity: 'warning',
                    category: 'documentation',
                    code: 'DOC002',
                    message: 'Missing docs/analysis/ folder',
                }));
            }
            if (!hasReadme) {
                issues.push((0, types_1.createIssue)({
                    severity: 'warning',
                    category: 'documentation',
                    code: 'DOC003',
                    message: 'Missing README.md',
                }));
            }
            if (totalDocLength < 5000) {
                issues.push((0, types_1.createIssue)({
                    severity: 'suggestion',
                    category: 'documentation',
                    code: 'DOC004',
                    message: 'Documentation is sparse, consider adding more details',
                }));
            }
        }
        return {
            phase: 'documentQuality',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.2,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                hasDocsFolder,
                hasReadme,
                docFileCount: docFiles.length,
                totalDocLength,
            },
        };
    }
    async readDocsFolder(docsPath, exists) {
        if (!exists)
            return { files: [], totalLength: 0 };
        try {
            const allFiles = await fs.promises.readdir(docsPath);
            const docFiles = allFiles.filter(f => f.endsWith('.md') || f.endsWith('.json'));
            const contents = await Promise.all(docFiles.map(async (file) => {
                try {
                    return await fs.promises.readFile(path.join(docsPath, file), 'utf-8');
                }
                catch {
                    return '';
                }
            }));
            const totalLength = contents.reduce((sum, c) => sum + c.length, 0);
            return { files: docFiles, totalLength };
        }
        catch {
            return { files: [], totalLength: 0 };
        }
    }
    async readReadme(readmePath, exists) {
        if (!exists)
            return { length: 0 };
        try {
            const content = await fs.promises.readFile(readmePath, 'utf-8');
            return { length: content.length };
        }
        catch {
            return { length: 0 };
        }
    }
}
exports.DocumentQualityEvaluator = DocumentQualityEvaluator;
//# sourceMappingURL=document-quality.evaluator.js.map