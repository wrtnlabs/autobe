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
const types_1 = require("../../types");
const base_1 = require("../base");
class RequirementsCoverageEvaluator extends base_1.BaseEvaluator {
    name = "RequirementsCoverageEvaluator";
    phase = "requirementsCoverage";
    description = "Evaluates requirements to implementation coverage";
    async evaluate(context) {
        const issues = [];
        const startTime = performance.now();
        const controllerCount = context.files.controllers.length;
        const providerCount = context.files.providers.length;
        const structureCount = context.files.structures.length;
        // Check controller-to-provider mapping
        const mapping = this.checkControllerProviderMapping(context.files.controllers, context.files.providers, issues);
        // Check if docs/analysis exists and has content
        const docsPath = path.join(context.project.rootPath, "docs", "analysis");
        let hasRequirementsDocs = false;
        let requirementsDocCount = 0;
        if (fs.existsSync(docsPath)) {
            try {
                const files = fs.readdirSync(docsPath);
                requirementsDocCount = files.filter((f) => f.endsWith(".md") || f.endsWith(".json")).length;
                hasRequirementsDocs = requirementsDocCount > 0;
            }
            catch {
                // Skip
            }
        }
        const score = this.computeRequirementsScore({
            controllerCount,
            providerCount,
            structureCount,
            hasRequirementsDocs,
            mappingRatio: mapping.ratio,
        }, issues);
        return {
            phase: "requirementsCoverage",
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
                mappedControllers: mapping.mapped,
                unmappedControllers: mapping.unmapped,
                mappingRatio: mapping.ratio,
            },
        };
    }
    /** Check how many controllers have matching providers */
    checkControllerProviderMapping(controllers, providers, issues) {
        if (controllers.length === 0)
            return { mapped: 0, unmapped: 0, ratio: 0 };
        const providerNames = providers.map((f) => path.basename(f, ".ts").toLowerCase().replace("provider", ""));
        let mapped = 0;
        const unmappedNames = [];
        for (const ctrl of controllers) {
            const ctrlName = path
                .basename(ctrl, ".ts")
                .toLowerCase()
                .replace("controller", "");
            // Check if any provider matches this controller's domain
            const hasProvider = providerNames.some((p) => p.includes(ctrlName) ||
                ctrlName.includes(p) ||
                this.extractDomain(ctrlName) === this.extractDomain(p));
            if (hasProvider) {
                mapped++;
            }
            else {
                unmappedNames.push(path.basename(ctrl, ".ts"));
            }
        }
        const unmapped = controllers.length - mapped;
        if (unmapped > 0) {
            const shown = unmappedNames.slice(0, 5).join(", ");
            const extra = unmappedNames.length > 5
                ? ` ... and ${unmappedNames.length - 5} more`
                : "";
            issues.push((0, types_1.createIssue)({
                severity: "warning",
                category: "requirements",
                code: "REQ005",
                message: `${unmapped} controller(s) have no matching provider: ${shown}${extra}`,
            }));
        }
        return {
            mapped,
            unmapped,
            ratio: mapped / controllers.length,
        };
    }
    /** Extract domain keyword from a filename */
    extractDomain(name) {
        // Remove common prefixes/suffixes and get the core domain
        return name
            .replace(/^(get|post|patch|put|delete|create|update|remove)/i, "")
            .replace(/(controller|provider|service|module)$/i, "")
            .trim();
    }
    computeRequirementsScore(counts, issues) {
        let score = 0;
        // Controllers exist (max 20)
        if (counts.controllerCount > 0) {
            score += 20;
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "requirements",
                code: "REQ001",
                message: "No controllers found - API endpoints not implemented",
            }));
        }
        // Providers exist (max 20)
        if (counts.providerCount > 0) {
            score += 20;
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "requirements",
                code: "REQ002",
                message: "No providers found - business logic not implemented",
            }));
        }
        // Controller-Provider mapping (max 25)
        score += Math.round(counts.mappingRatio * 25);
        // Structures exist (max 15)
        if (counts.structureCount > 0) {
            score += 15;
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: "warning",
                category: "requirements",
                code: "REQ003",
                message: "No structures/DTOs found",
            }));
        }
        // Provider depth — multiple providers per controller (max 10)
        if (counts.controllerCount > 0) {
            const ratio = counts.providerCount / counts.controllerCount;
            if (ratio >= 2)
                score += 10;
            else if (ratio >= 1.5)
                score += 7;
            else if (ratio >= 1)
                score += 5;
        }
        // Requirements docs exist (max 10)
        if (counts.hasRequirementsDocs) {
            score += 10;
        }
        else {
            issues.push((0, types_1.createIssue)({
                severity: "warning",
                category: "requirements",
                code: "REQ004",
                message: "No requirements documents found in docs/analysis/",
            }));
        }
        return Math.min(100, score);
    }
}
exports.RequirementsCoverageEvaluator = RequirementsCoverageEvaluator;
//# sourceMappingURL=requirements-coverage.evaluator.js.map