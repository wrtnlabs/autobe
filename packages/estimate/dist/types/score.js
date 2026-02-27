"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHASE_NAMES = exports.PHASE_WEIGHTS = exports.AGENT_WEIGHTS = exports.AGENT_WEIGHT_RATIO = exports.GATE_PENALTY_PER_PERCENT = exports.GATE_ERROR_THRESHOLD = void 0;
exports.scoreToGrade = scoreToGrade;
exports.createEmptyPhaseResult = createEmptyPhaseResult;
exports.generateExplanation = generateExplanation;
exports.GATE_ERROR_THRESHOLD = 0.05;
exports.GATE_PENALTY_PER_PERCENT = 5;
exports.AGENT_WEIGHT_RATIO = 0.3;
exports.AGENT_WEIGHTS = {
    SecurityAgent: 0.5, // 50% of agent portion
    LLMQualityAgent: 0.5, // 50% of agent portion
};
/** New phase weights (total = 100%) */
exports.PHASE_WEIGHTS = {
    // Gate (pass/fail, no weight)
    gate: 0,
    // New scoring phases
    documentQuality: 0.2, // 20%
    requirementsCoverage: 0.25, // 25%
    testCoverage: 0.2, // 20%
    logicCompleteness: 0.2, // 20%
    apiCompleteness: 0.15, // 15%
    // Legacy (not used in score)
    requirements: 0,
    database: 0,
    api: 0,
    test: 0,
    implementation: 0,
    functionality: 0,
    quality: 0,
    safety: 0,
    llmSpecific: 0,
    goldenSet: 0,
};
/** Phase display names */
exports.PHASE_NAMES = {
    gate: "Gate",
    // New scoring phases
    documentQuality: "Document Quality",
    requirementsCoverage: "Requirements Coverage",
    testCoverage: "Test Coverage",
    logicCompleteness: "Logic Completeness",
    apiCompleteness: "API Completeness",
    // Legacy
    requirements: "Requirements (Analyze)",
    database: "DB Design (Database)",
    api: "API Design (Interface)",
    test: "Test (Test)",
    implementation: "Implementation (Realize)",
    functionality: "Functionality",
    quality: "Quality",
    safety: "Safety",
    llmSpecific: "LLM Specific",
    goldenSet: "Golden Set",
};
/** Convert score to grade */
function scoreToGrade(score) {
    if (score >= 90)
        return "A";
    if (score >= 80)
        return "B";
    if (score >= 70)
        return "C";
    if (score >= 60)
        return "D";
    return "F";
}
/** Create empty PhaseResult */
function createEmptyPhaseResult(phase) {
    return {
        phase,
        passed: true,
        score: 0,
        maxScore: 100,
        weightedScore: 0,
        issues: [],
        durationMs: 0,
    };
}
/** Generate score explanation from issues */
function generateExplanation(issues, score) {
    const reasons = [];
    const suggestions = [];
    const issuesByCode = new Map();
    for (const issue of issues) {
        const existing = issuesByCode.get(issue.code) || [];
        existing.push(issue);
        issuesByCode.set(issue.code, existing);
    }
    const issueSummaries = Array.from(issuesByCode).map(([code, codeIssues]) => ({
        code,
        count: codeIssues.length,
        message: codeIssues[0].message,
        severity: codeIssues[0].severity,
    }));
    issueSummaries.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0)
            return severityDiff;
        return b.count - a.count;
    });
    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    if (criticalCount > 0) {
        reasons.push(`${criticalCount} critical issue(s) found`);
        suggestions.push("Fix all critical issues first");
    }
    if (warningCount > 10) {
        reasons.push(`${warningCount} warnings detected`);
        suggestions.push("Address warnings to improve quality");
    }
    for (const summary of issueSummaries.slice(0, 3)) {
        reasons.push(`${summary.count}x ${summary.message}`);
    }
    return { reasons, issueSummaries, suggestions };
}
//# sourceMappingURL=score.js.map