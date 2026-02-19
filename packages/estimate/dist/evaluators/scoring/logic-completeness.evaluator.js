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
const base_1 = require("../base");
const types_1 = require("../../types");
class LogicCompletenessEvaluator extends base_1.BaseEvaluator {
    name = 'LogicCompletenessEvaluator';
    phase = 'logicCompleteness';
    description = 'Checks for incomplete implementations';
    INCOMPLETE_PATTERNS = [
        { pattern: /throw\s+new\s+Error\s*\(\s*['`]not\s*implemented['"`]\s*\)/gi, code: 'LOGIC001', message: 'Unimplemented code: throw new Error("not implemented")' },
        { pattern: /\/\/\s*TODO\s*:/gi, code: 'LOGIC002', message: 'TODO comment found' },
        { pattern: /\/\/\s*FIXME\s*:/gi, code: 'LOGIC003', message: 'FIXME comment found (indicates known bug)' },
        { pattern: /\/\/\s*HACK\s*:/gi, code: 'LOGIC004', message: 'HACK comment found' },
        { pattern: /\/\/\s*implement\s*this/gi, code: 'LOGIC005', message: 'Unimplemented placeholder found' },
        { pattern: /throw\s+new\s+Error\s*\(\s*['`]TODO['"`]\s*\)/gi, code: 'LOGIC006', message: 'TODO error placeholder' },
        { pattern: /notImplemented\s*\(\s*\)/gi, code: 'LOGIC007', message: 'notImplemented() call found' },
    ];
    async evaluate(context) {
        const startTime = performance.now();
        const filesToCheck = [
            ...context.files.controllers,
            ...context.files.providers,
        ];
        const results = await Promise.all(filesToCheck.map(filePath => this.analyzeFile(filePath)));
        const issues = results.flatMap(r => r);
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        let score;
        if (criticalCount === 0 && issues.length === 0) {
            score = 100;
        }
        else if (criticalCount === 0) {
            score = Math.max(70, 100 - issues.length * 2);
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
            phase: 'logicCompleteness',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.2,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                totalIncomplete: issues.length,
                criticalCount,
                todoCount: issues.filter(i => i.code === 'LOGIC002').length,
                fixmeCount: issues.filter(i => i.code === 'LOGIC003').length,
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
                for (const { pattern, code, message } of this.INCOMPLETE_PATTERNS) {
                    // init regex instance state (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)
                    pattern.lastIndex = 0;
                    if (pattern.test(line)) {
                        const severity = (code === 'LOGIC002') ? 'warning' : 'critical';
                        issues.push((0, types_1.createIssue)({
                            severity,
                            category: 'completeness',
                            code,
                            message,
                            location: { file: filePath, line: i + 1 },
                        }));
                    }
                }
            }
            return issues;
        }
        catch (error) {
            console.error(`Failed to analyze file ${filePath}:`, error);
            return [];
        }
    }
}
exports.LogicCompletenessEvaluator = LogicCompletenessEvaluator;
//# sourceMappingURL=logic-completeness.evaluator.js.map