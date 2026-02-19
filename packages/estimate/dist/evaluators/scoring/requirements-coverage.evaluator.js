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
exports.RequirementsCoverageEvaluator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const base_1 = require("../base");
const types_1 = require("../../types");
class RequirementsCoverageEvaluator extends base_1.BaseEvaluator {
    name = 'RequirementsCoverageEvaluator';
    phase = 'requirementsCoverage';
    description = 'Evaluates requirements to implementation coverage';
    async evaluate(context) {
        const issues = [];
        const startTime = performance.now();
        // Count controllers (each controller = 1 feature)
        const controllerCount = context.files.controllers.length;
        // Count providers (business logic)
        const providerCount = context.files.providers.length;
        // Count structures (DTOs)
        const structureCount = context.files.structures.length;
        // Check if docs/analysis exists and has content
        const docsPath = path.join(context.project.rootPath, 'docs', 'analysis');
        let hasRequirementsDocs = false;
        let requirementsDocCount = 0;
        if (fs.existsSync(docsPath)) {
            try {
                const files = fs.readdirSync(docsPath);
                requirementsDocCount = files.filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
                hasRequirementsDocs = requirementsDocCount > 0;
            }
            catch {
                // Skip
            }
        }
        // Calculate coverage score
        const score = this.computeRequirementsScore({
            controllerCount,
            providerCount,
            structureCount,
            hasRequirementsDocs,
        }, issues);
        return {
            phase: 'requirementsCoverage',
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.25,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                controllerCount,
                providerCount,
                structureCount,
                requirementsDocCount,
                hasRequirementsDocs,
            },
        };
    }
    computeRequirementsScore(counts, issues) {
        let score = 0;
        // Controllers exist (API endpoints defined)
        if (counts.controllerCount > 0) {
            score += 30;
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: 'critical',
                category: 'requirements',
                code: 'REQ001',
                message: 'No controllers found - API endpoints not implemented',
            }));
        }
        // Providers exist (business logic implemented)
        if (counts.providerCount > 0) {
            score += 30;
            // Check controller to provider ratio
            const ratio = counts.providerCount / Math.max(counts.controllerCount, 1);
            if (ratio >= 2) {
                score += 10; // Good: multiple providers per controller
            }
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: 'critical',
                category: 'requirements',
                code: 'REQ002',
                message: 'No providers found - business logic not implemented',
            }));
        }
        // Structures exist (data models defined)
        if (counts.structureCount > 0) {
            score += 20;
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: 'warning',
                category: 'requirements',
                code: 'REQ003',
                message: 'No structures/DTOs found',
            }));
        }
        // Requirements docs exist
        if (counts.hasRequirementsDocs) {
            score += 10;
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: 'warning',
                category: 'requirements',
                code: 'REQ004',
                message: 'No requirements documents found in docs/analysis/',
            }));
        }
        return Math.min(100, score);
    }
}
exports.RequirementsCoverageEvaluator = RequirementsCoverageEvaluator;
//# sourceMappingURL=requirements-coverage.evaluator.js.map