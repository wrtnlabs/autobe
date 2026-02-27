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
exports.DuplicationEvaluator = void 0;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const base_1 = require("../base");
const types_1 = require("../../types");
class DuplicationEvaluator extends base_1.BaseEvaluator {
    name = 'DuplicationEvaluator';
    phase = 'quality';
    description = 'Detects duplicate code blocks';
    MIN_LINES = 10;
    MIN_CHARS = 100;
    async evaluate(context) {
        const startTime = performance.now();
        const filesToCheck = [
            ...context.files.controllers,
            ...context.files.providers,
        ];
        const codeBlocks = new Map();
        // Read all files in parallel
        const fileContents = await Promise.all(filesToCheck.map(async (filePath) => {
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                return { filePath, content };
            }
            catch {
                return null;
            }
        }));
        // Collect blocks from all files
        for (const result of fileContents) {
            if (result) {
                this.collectBlocks(result.filePath, result.content, codeBlocks);
            }
        }
        // Find duplicates
        const issues = [];
        const reportedHashes = new Set();
        for (const [hash, locations] of codeBlocks) {
            if (locations.length > 1 && !reportedHashes.has(hash)) {
                reportedHashes.add(hash);
                issues.push((0, types_1.createIssue)({
                    severity: 'warning',
                    category: 'duplication',
                    code: 'D001',
                    message: `Duplicate code block found in ${locations.length} locations`,
                    location: locations[0],
                }));
            }
        }
        const score = this.calculateScore(issues);
        return {
            phase: 'quality',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.3,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                duplicateBlocks: issues.length,
                filesScanned: filesToCheck.length,
            },
        };
    }
    collectBlocks(filePath, content, codeBlocks) {
        const lines = content.split('\n');
        for (let i = 0; i <= lines.length - this.MIN_LINES; i++) {
            const block = lines
                .slice(i, i + this.MIN_LINES)
                .map(line => line.trim())
                .filter(line => {
                return (line.length > 0 &&
                    !line.startsWith('//') &&
                    !line.startsWith('*') &&
                    !line.startsWith('/*') &&
                    !line.startsWith('import ') &&
                    !line.startsWith('export '));
            })
                .join('\n');
            if (block.length < this.MIN_CHARS)
                continue;
            const codeChars = block.replace(/[{}\[\]();,\s]/g, '');
            if (codeChars.length < 30)
                continue;
            const hash = crypto.createHash('md5').update(block).digest('hex');
            if (!codeBlocks.has(hash)) {
                codeBlocks.set(hash, []);
            }
            codeBlocks.get(hash).push({ file: filePath, line: i + 1 });
        }
    }
}
exports.DuplicationEvaluator = DuplicationEvaluator;
//# sourceMappingURL=duplication.evaluator.js.map