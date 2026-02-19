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
exports.TestCoverageEvaluator = void 0;
const path = __importStar(require("path"));
const base_1 = require("../base");
const types_1 = require("../../types");
class TestCoverageEvaluator extends base_1.BaseEvaluator {
    name = 'TestCoverageEvaluator';
    phase = 'testCoverage';
    description = 'Evaluates test coverage';
    async evaluate(context) {
        const issues = [];
        const startTime = performance.now();
        const testCount = context.files.tests.length;
        const controllerCount = context.files.controllers.length;
        const providerCount = context.files.providers.length;
        // Calculate expected tests (at least 1 test per controller)
        const expectedMinTests = controllerCount;
        // Calculate coverage ratio
        const coverageRatio = expectedMinTests > 0
            ? Math.min(testCount / expectedMinTests, 1)
            : (testCount > 0 ? 1 : 0);
        const score = this.computeCoverageScore(testCount, controllerCount, coverageRatio, issues);
        // Extract controller names and check which have tests
        const controllerNames = context.files.controllers.map(f => {
            const basename = path.basename(f, '.ts');
            return basename.replace('Controller', '').toLowerCase();
        });
        const testNames = context.files.tests.map(f => {
            return path.basename(f, '.ts').toLowerCase();
        });
        let coveredControllers = 0;
        for (const ctrl of controllerNames) {
            const hasTest = testNames.some(t => t.includes(ctrl) || ctrl.includes(t.replace('test_api_', '')));
            if (hasTest)
                coveredControllers++;
        }
        const actualCoverage = controllerCount > 0
            ? Math.round((coveredControllers / controllerCount) * 100)
            : 0;
        return {
            phase: 'testCoverage',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.2,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                testCount,
                controllerCount,
                providerCount,
                coverageRatio: Math.round(coverageRatio * 100),
                actualCoverage,
            },
        };
    }
    computeCoverageScore(testCount, controllerCount, coverageRatio, issues) {
        if (testCount === 0) {
            issues.push((0, types_1.createIssue)({
                severity: 'critical',
                category: 'test',
                code: 'TEST001',
                message: 'No test files found',
            }));
            return 0;
        }
        // Base score from coverage ratio
        let score = Math.round(coverageRatio * 70);
        // Bonus for test count
        if (testCount >= controllerCount * 3) {
            score += 30; // Excellent: 3+ tests per controller
        }
        else if (testCount >= controllerCount * 2) {
            score += 20; // Good: 2+ tests per controller
        }
        else if (testCount >= controllerCount) {
            score += 10; // OK: 1+ test per controller
        }
        // Check for missing coverage
        if (testCount < controllerCount) {
            issues.push((0, types_1.createIssue)({
                severity: 'warning',
                category: 'test',
                code: 'TEST002',
                message: `Only ${testCount} tests for ${controllerCount} controllers`,
            }));
        }
        return Math.min(100, score);
    }
}
exports.TestCoverageEvaluator = TestCoverageEvaluator;
//# sourceMappingURL=test-coverage.evaluator.js.map