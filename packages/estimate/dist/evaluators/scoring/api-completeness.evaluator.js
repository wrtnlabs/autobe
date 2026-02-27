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
exports.ApiCompletenessEvaluator = void 0;
const fs = __importStar(require("fs"));
const ts = __importStar(require("typescript"));
const types_1 = require("../../types");
const base_1 = require("../base");
class ApiCompletenessEvaluator extends base_1.BaseEvaluator {
    name = "ApiCompletenessEvaluator";
    phase = "apiCompleteness";
    description = "Evaluates API implementation completeness";
    async evaluate(context) {
        const startTime = performance.now();
        const results = await Promise.all(context.files.controllers.map((filePath) => this.analyzeFile(filePath)));
        const issues = results.flatMap((r) => r.issues);
        const totalEndpoints = results.reduce((sum, r) => sum + r.totalEndpoints, 0);
        const emptyEndpoints = results.reduce((sum, r) => sum + r.emptyEndpoints, 0);
        const implementedEndpoints = results.reduce((sum, r) => sum + r.implementedEndpoints, 0);
        const stubEndpoints = results.reduce((sum, r) => sum + r.stubEndpoints, 0);
        const noProviderEndpoints = results.reduce((sum, r) => sum + r.noProviderEndpoints, 0);
        let score = 0;
        if (totalEndpoints === 0) {
            score = 0;
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "api",
                code: "API002",
                message: "No API endpoints found",
            }));
        }
        else {
            // Non-empty ratio (max 40)
            const nonEmptyRatio = (totalEndpoints - emptyEndpoints) / totalEndpoints;
            score += Math.round(nonEmptyRatio * 40);
            // Implementation ratio (max 30)
            const implementationRatio = implementedEndpoints / totalEndpoints;
            score += Math.round(implementationRatio * 30);
            // Provider delegation ratio (max 30)
            const withProviderRatio = (totalEndpoints - noProviderEndpoints) / totalEndpoints;
            score += Math.round(withProviderRatio * 30);
            if (emptyEndpoints > 0) {
                issues.push((0, types_1.createIssue)({
                    severity: "warning",
                    category: "api",
                    code: "API003",
                    message: `${emptyEndpoints} of ${totalEndpoints} endpoints are empty`,
                }));
            }
            if (stubEndpoints > 0) {
                issues.push((0, types_1.createIssue)({
                    severity: "warning",
                    category: "api",
                    code: "API005",
                    message: `${stubEndpoints} endpoints return stub values (empty object/array/null)`,
                }));
            }
            if (noProviderEndpoints > 0) {
                issues.push((0, types_1.createIssue)({
                    severity: "suggestion",
                    category: "api",
                    code: "API006",
                    message: `${noProviderEndpoints} endpoints don't delegate to a provider/service`,
                }));
            }
        }
        score = Math.min(100, Math.max(0, score));
        return {
            phase: "apiCompleteness",
            passed: true,
            score,
            maxScore: 100,
            weightedScore: score * 0.15,
            issues,
            durationMs: Math.round(performance.now() - startTime),
            metrics: {
                totalEndpoints,
                emptyEndpoints,
                stubEndpoints,
                implementedEndpoints,
                noProviderEndpoints,
                completionRate: totalEndpoints > 0
                    ? Math.round(((totalEndpoints - emptyEndpoints) / totalEndpoints) * 100)
                    : 0,
                implementationRate: totalEndpoints > 0
                    ? Math.round((implementedEndpoints / totalEndpoints) * 100)
                    : 0,
            },
        };
    }
    async analyzeFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
            const issues = [];
            let totalEndpoints = 0;
            let emptyEndpoints = 0;
            let implementedEndpoints = 0;
            let stubEndpoints = 0;
            let noProviderEndpoints = 0;
            const visit = (node) => {
                if (ts.isMethodDeclaration(node)) {
                    const decorators = ts.getDecorators(node);
                    if (decorators && decorators.length > 0) {
                        totalEndpoints++;
                        if (node.body) {
                            const bodyText = node.body.getText(sourceFile).trim();
                            if (bodyText === "{}" || bodyText.match(/^\{\s*\}$/)) {
                                // Empty endpoint
                                emptyEndpoints++;
                                issues.push((0, types_1.createIssue)({
                                    severity: "critical",
                                    category: "api",
                                    code: "API001",
                                    message: `Empty endpoint: ${node.name?.getText(sourceFile)}`,
                                    location: {
                                        file: filePath,
                                        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                                    },
                                }));
                            }
                            else if (this.isStubBody(bodyText)) {
                                // Stub return
                                stubEndpoints++;
                            }
                            else {
                                // Check for real implementation
                                const hasRealLogic = bodyText.includes("await") ||
                                    (bodyText.includes("this.") && bodyText.includes("(")) ||
                                    bodyText.includes("try");
                                if (hasRealLogic) {
                                    implementedEndpoints++;
                                }
                                // Check for provider/service delegation
                                const delegatesToProvider = /this\.\w*(provider|service|repository|usecase)/i.test(bodyText) ||
                                    /this\.\w+\.\w+\s*\(/i.test(bodyText) ||
                                    /return\s+.*this\./i.test(bodyText) ||
                                    /await\s+this\./i.test(bodyText);
                                if (!delegatesToProvider && !hasRealLogic) {
                                    noProviderEndpoints++;
                                }
                            }
                        }
                    }
                }
                ts.forEachChild(node, visit);
            };
            visit(sourceFile);
            return {
                issues,
                totalEndpoints,
                emptyEndpoints,
                implementedEndpoints,
                stubEndpoints,
                noProviderEndpoints,
            };
        }
        catch {
            return {
                issues: [],
                totalEndpoints: 0,
                emptyEndpoints: 0,
                implementedEndpoints: 0,
                stubEndpoints: 0,
                noProviderEndpoints: 0,
            };
        }
    }
    /** Check if method body is a stub (returns empty/null) */
    isStubBody(bodyText) {
        return /^\{\s*return\s+(?:\{\}|\[\]|null|undefined)\s*;?\s*\}$/.test(bodyText);
    }
}
exports.ApiCompletenessEvaluator = ApiCompletenessEvaluator;
//# sourceMappingURL=api-completeness.evaluator.js.map