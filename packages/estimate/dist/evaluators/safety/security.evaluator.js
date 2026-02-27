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
exports.SecurityEvaluator = void 0;
const fs = __importStar(require("fs"));
const base_1 = require("../base");
const types_1 = require("../../types");
class SecurityEvaluator extends base_1.BaseEvaluator {
    name = 'SecurityEvaluator';
    phase = 'safety';
    description = 'Checks for security vulnerabilities';
    PATTERNS = [
        { pattern: /password\s*[=:]\s*['`][^'"`]+['"`]/gi, code: 'S001', message: 'Hardcoded password detected', severity: 'critical' },
        { pattern: /api[_-]?key\s*[=:]\s*['`][^'"`]+['"`]/gi, code: 'S002', message: 'Hardcoded API key detected', severity: 'critical' },
        { pattern: /secret\s*[=:]\s*['`][^'"`]+['"`]/gi, code: 'S003', message: 'Hardcoded secret detected', severity: 'critical' },
        { pattern: /\beval\s*\(/gi, code: 'S004', message: 'Use of eval() is dangerous', severity: 'critical' },
        { pattern: /\.innerHTML\s*=/gi, code: 'S005', message: 'innerHTML assignment may lead to XSS', severity: 'warning' },
    ];
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
            phase: 'safety',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.2,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                filesChecked: filesToCheck.length,
                securityIssues: issues.length,
            },
        };
    }
    async analyzeFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const issues = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                for (const { pattern, code, message, severity } of this.PATTERNS) {
                    pattern.lastIndex = 0;
                    if (pattern.test(line)) {
                        issues.push((0, types_1.createIssue)({
                            severity,
                            category: 'security',
                            code,
                            message,
                            location: { file: filePath, line: i + 1 },
                        }));
                    }
                }
            }
            return issues;
        }
        catch {
            return [];
        }
    }
    isTestFile(filePath) {
        return filePath.includes('/test/') ||
            filePath.includes('.test.') ||
            filePath.includes('.spec.') ||
            filePath.includes('test_');
    }
}
exports.SecurityEvaluator = SecurityEvaluator;
//# sourceMappingURL=security.evaluator.js.map