"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIssue = createIssue;
/** Create issue helper */
function createIssue(partial) {
    return {
        ...partial,
        id: partial.id ??
            `${partial.category}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        autoFixable: partial.autoFixable ?? false,
    };
}
//# sourceMappingURL=issue.js.map