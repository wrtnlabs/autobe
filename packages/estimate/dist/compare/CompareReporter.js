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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareReporter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CompareReporter {
    generateMarkdown(result) {
        const lines = [];
        lines.push("# Project Comparison Report");
        lines.push("");
        lines.push(`**Generated**: ${result.timestamp}`);
        lines.push(`**Projects Compared**: ${result.projectCount}`);
        lines.push("");
        // 1. Ranking
        lines.push("## 1. Overall Ranking");
        lines.push("");
        lines.push("| Rank | Project | Score | Grade |");
        lines.push("|------|---------|-------|-------|");
        for (const r of result.ranking) {
            const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : "";
            lines.push(`| ${medal} ${r.rank} | ${r.name} | ${r.score}/100 | ${r.grade} |`);
        }
        lines.push("");
        // Winner
        lines.push("### 🏆 Winner");
        lines.push("");
        lines.push(`**${result.summary.overallWinner}**`);
        lines.push("");
        lines.push(`> ${result.summary.recommendation}`);
        lines.push("");
        // 2. Project Details
        lines.push("## 2. Project Details");
        lines.push("");
        for (const p of result.projects) {
            lines.push(`### ${p.name}`);
            lines.push("");
            lines.push(`- **Score**: ${p.totalScore}/100 (${p.grade})`);
            lines.push(`- **Gate**: ${p.gatePass ? "✅ Pass" : "❌ Fail"}`);
            lines.push(`- **Files**: ${p.metrics.files} | **Controllers**: ${p.metrics.controllers} | **Providers**: ${p.metrics.providers} | **Tests**: ${p.metrics.tests}`);
            if (p.agentScores) {
                lines.push(`- **Security**: ${p.agentScores.security}/100 | **LLM Quality**: ${p.agentScores.llmQuality}/100`);
            }
            if (p.penalties) {
                const parts = [];
                if (p.penalties.warning)
                    parts.push(`Warning -${p.penalties.warning}`);
                if (p.penalties.duplication)
                    parts.push(`Duplication -${p.penalties.duplication}`);
                if (p.penalties.jsdoc)
                    parts.push(`JSDoc -${p.penalties.jsdoc}`);
                lines.push(`- **Penalties**: ${parts.join(" | ")} (Total: -${p.penalties.total})`);
            }
            lines.push("");
        }
        // 3. Phase Comparison
        lines.push("## 3. Phase Score Comparison");
        lines.push("");
        const phaseHeaders = [
            "Phase",
            ...result.projects.map((p) => p.name),
            "Winner",
        ];
        lines.push("| " + phaseHeaders.join(" | ") + " |");
        lines.push("|" + phaseHeaders.map(() => "------").join("|") + "|");
        for (const phase of result.phaseComparison) {
            const scores = phase.scores.map((s) => `${s.score}/100`);
            lines.push(`| ${phase.phase} | ${scores.join(" | ")} | ${phase.winner} |`);
        }
        lines.push("");
        // 4. Metrics Comparison
        lines.push("## 4. Code Metrics Comparison");
        lines.push("");
        const metricHeaders = [
            "Metric",
            ...result.projects.map((p) => p.name),
            "Better",
        ];
        lines.push("| " + metricHeaders.join(" | ") + " |");
        lines.push("|" + metricHeaders.map(() => "------").join("|") + "|");
        for (const m of result.metricComparison) {
            const values = m.values.map((v) => String(v.value));
            lines.push(`| ${m.metric} | ${values.join(" | ")} | ${m.better} |`);
        }
        lines.push("");
        // 5. Agent Comparison (if available)
        if (result.agentComparison) {
            lines.push("## 5. AI Agent Comparison");
            lines.push("");
            const agentHeaders = [
                "Agent",
                ...result.projects.map((p) => p.name),
                "Winner",
            ];
            lines.push("| " + agentHeaders.join(" | ") + " |");
            lines.push("|" + agentHeaders.map(() => "------").join("|") + "|");
            for (const a of result.agentComparison) {
                const scores = a.scores.map((s) => `${s.score}/100`);
                lines.push(`| ${a.agent} | ${scores.join(" | ")} | ${a.winner} |`);
            }
            lines.push("");
        }
        // 6. Issues Summary
        lines.push("## 6. Issues Summary");
        lines.push("");
        const issueHeaders = ["Category", ...result.projects.map((p) => p.name)];
        lines.push("| " + issueHeaders.join(" | ") + " |");
        lines.push("|" + issueHeaders.map(() => "------").join("|") + "|");
        lines.push(`| Gate Issues | ${result.projects.map((p) => (p.issues.gate === 0 ? "✅ 0" : p.issues.gate)).join(" | ")} |`);
        lines.push(`| Requirements Issues | ${result.projects.map((p) => (p.issues.requirements === 0 ? "✅ 0" : p.issues.requirements)).join(" | ")} |`);
        lines.push(`| Logic Issues | ${result.projects.map((p) => (p.issues.logic === 0 ? "✅ 0" : p.issues.logic)).join(" | ")} |`);
        lines.push("");
        // 7. Conclusion
        lines.push("## 7. Conclusion");
        lines.push("");
        lines.push(result.summary.recommendation);
        lines.push("");
        lines.push("---");
        lines.push("*Generated by @autobe/estimate compare*");
        return lines.join("\n");
    }
    generateJson(result) {
        return JSON.stringify(result, null, 2);
    }
    printToTerminal(result) {
        console.log("");
        console.log(chalk_1.default.bold("═".repeat(70)));
        console.log(chalk_1.default.bold.cyan("  📊 Project Comparison Result"));
        console.log(chalk_1.default.bold("═".repeat(70)));
        console.log("");
        // Ranking
        this.printSection("🏆 Ranking");
        for (const r of result.ranking) {
            const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : "  ";
            const scoreColor = r.score >= 90 ? chalk_1.default.green : r.score >= 70 ? chalk_1.default.yellow : chalk_1.default.red;
            console.log(`  ${medal} #${r.rank}  ${r.name.padEnd(25)} ${scoreColor(`${r.score}/100`)} (${r.grade})`);
            const project = result.projects.find((p) => p.name === r.name);
            if (project?.penalties) {
                console.log(`         Penalties: -${project.penalties.total}`);
            }
        }
        console.log("");
        // Phase Comparison
        this.printSection("📈 Phase Score Comparison");
        for (const phase of result.phaseComparison) {
            const scores = phase.scores
                .map((s) => {
                const color = s.score >= 90
                    ? chalk_1.default.green
                    : s.score >= 70
                        ? chalk_1.default.yellow
                        : chalk_1.default.red;
                return `${s.name.substring(0, 12)}: ${color(`${s.score}`)}`;
            })
                .join(" │ ");
            console.log(`  ${phase.phase.padEnd(22)} │ ${scores} │ ${chalk_1.default.cyan(phase.winner)}`);
        }
        console.log("");
        // Metrics
        this.printSection("📊 Metrics Comparison");
        for (const m of result.metricComparison) {
            const values = m.values
                .map((v) => `${v.name.substring(0, 12)}: ${v.value}`)
                .join(" │ ");
            console.log(`  ${m.metric.padEnd(15)} │ ${values} │ ${chalk_1.default.cyan(m.better)}`);
        }
        console.log("");
        // Agent Comparison
        if (result.agentComparison) {
            this.printSection("🤖 AI Agent Comparison");
            for (const a of result.agentComparison) {
                const scores = a.scores
                    .map((s) => {
                    const color = s.score >= 90
                        ? chalk_1.default.green
                        : s.score >= 70
                            ? chalk_1.default.yellow
                            : chalk_1.default.red;
                    return `${s.name.substring(0, 12)}: ${color(`${s.score}`)}`;
                })
                    .join(" │ ");
                console.log(`  ${a.agent.padEnd(18)} │ ${scores} │ ${chalk_1.default.cyan(a.winner)}`);
            }
            console.log("");
        }
        // Summary
        console.log(chalk_1.default.bold("═".repeat(70)));
        console.log(chalk_1.default.bold("🏆 Winner: ") +
            chalk_1.default.green.bold(result.summary.overallWinner));
        console.log(chalk_1.default.bold("📝 ") + result.summary.recommendation);
        console.log(chalk_1.default.bold("═".repeat(70)));
        console.log("");
    }
    printSection(title) {
        console.log(chalk_1.default.bold("┌" + "─".repeat(68) + "┐"));
        console.log(chalk_1.default.bold(`│  ${title.padEnd(65)} │`));
        console.log(chalk_1.default.bold("└" + "─".repeat(68) + "┘"));
        console.log("");
    }
    saveReports(result, outputPath) {
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        const mdPath = path.join(outputPath, "comparison-report.md");
        const jsonPath = path.join(outputPath, "comparison-report.json");
        fs.writeFileSync(mdPath, this.generateMarkdown(result));
        fs.writeFileSync(jsonPath, this.generateJson(result));
        return { mdPath, jsonPath };
    }
}
exports.CompareReporter = CompareReporter;
//# sourceMappingURL=CompareReporter.js.map