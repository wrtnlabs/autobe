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
exports.AutoFixer = void 0;
const fs = __importStar(require("fs"));
class AutoFixer {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    async fix(issues) {
        const results = [];
        const fixable = issues.filter((i) => this.canFix(i));
        if (fixable.length === 0) {
            return results;
        }
        const byFile = new Map();
        for (const issue of fixable) {
            if (!issue.location?.file)
                continue;
            const existing = byFile.get(issue.location.file) || [];
            existing.push(issue);
            byFile.set(issue.location.file, existing);
        }
        for (const [file, fileIssues] of byFile) {
            try {
                let content = await fs.promises.readFile(file, "utf-8");
                let changed = false;
                for (const issue of fileIssues) {
                    const before = content;
                    content = this.applyFix(content, issue);
                    if (content !== before) {
                        changed = true;
                        results.push({
                            file,
                            code: issue.code,
                            fixed: true,
                            description: `Fixed ${issue.code}: ${issue.message}`,
                        });
                        if (this.verbose) {
                            console.log(`  ✅ Fixed ${issue.code} in ${file}`);
                        }
                    }
                }
                if (changed) {
                    await fs.promises.writeFile(file, content, "utf-8");
                }
            }
            catch (err) {
                results.push({
                    file,
                    code: fileIssues[0].code,
                    fixed: false,
                    description: `Failed to fix: ${err instanceof Error ? err.message : "Unknown error"}`,
                });
            }
        }
        return results;
    }
    canFix(issue) {
        return ["TS1161", "TS7006"].includes(issue.code);
    }
    applyFix(content, issue) {
        switch (issue.code) {
            case "TS1161":
                return this.fixUnterminatedRegex(content, issue);
            case "TS7006":
                return this.fixImplicitAny(content, issue);
            default:
                return content;
        }
    }
    fixUnterminatedRegex(content, issue) {
        // LLM puts literal newlines inside regex and strings
        // Broken:  .replace(/\n/g, "\\n")  (where \n are actual newlines)
        // Fixed:   .replace(/\n/g, "\\n")  (proper escape sequences)
        // Look for .replace(/ + newline + /g, " + optional backslash + newline + ")
        const broken = '.replace(/\n/g, "\\\n")';
        const fixed = '.replace(/\\n/g, "\\\\n")';
        if (content.includes(broken)) {
            return content.replace(broken, fixed);
        }
        // Also try without the backslash
        const broken2 = '.replace(/\n/g, "\n")';
        const fixed2 = '.replace(/\\n/g, "\\\\n")';
        if (content.includes(broken2)) {
            return content.replace(broken2, fixed2);
        }
        return content;
    }
    fixImplicitAny(content, issue) {
        const lines = content.split("\n");
        const lineIdx = (issue.location?.line || 1) - 1;
        if (lineIdx >= lines.length)
            return content;
        const paramMatch = issue.message.match(/Parameter '(\w+)'/);
        if (!paramMatch)
            return content;
        const paramName = paramMatch[1];
        const line = lines[lineIdx];
        const regex = new RegExp(`(\\b${paramName})(\\s*[,)=])`, "g");
        lines[lineIdx] = line.replace(regex, `$1: any$2`);
        return lines.join("\n");
    }
    getSummary(results) {
        const fixed = results.filter((r) => r.fixed).length;
        const failed = results.filter((r) => !r.fixed).length;
        return `Auto-fix complete: ${fixed} fixed, ${failed} failed`;
    }
}
exports.AutoFixer = AutoFixer;
//# sourceMappingURL=auto-fixer.js.map