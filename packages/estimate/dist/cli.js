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
exports.createProgram = createProgram;
exports.runCLI = runCLI;
const p = __importStar(require("@clack/prompts"));
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const agents_1 = require("./agents");
const pipeline_1 = require("./core/pipeline");
const reporters_1 = require("./reporters");
const telemetry_1 = require("./telemetry");
const types_1 = require("./types");
function createProgram() {
    const program = new commander_1.Command();
    program
        .name("estimate")
        .description("Evaluate AutoBE generated code quality")
        .version("0.3.0")
        .requiredOption("-i, --input <path>", "Input project path")
        .requiredOption("-o, --output <path>", "Output directory for reports")
        .option("-v, --verbose", "Enable verbose output (default: false)", false)
        .option("--continue-on-gate-failure", "Continue evaluation even if gate fails (default: false)", false)
        .option("--use-agent", "Enable AI agent evaluation (default: false)", false)
        .option("--provider <provider>", "LLM provider (default: openrouter)", "openrouter")
        .option("--api-key <key>", "API key for LLM provider")
        .option("--auto-fix", "Auto-fix simple issues after evaluation", false)
        .option("--run-tests", "Start Docker server and run e2e tests", false)
        .option("--golden", "Run Golden Set evaluation", false)
        .option("--project <project>", "Project type for Golden Set (todo|bbs|reddit|shopping)")
        .action(async (options) => {
        await runCLI(options);
    });
    program
        .command("compare")
        .description("Compare multiple model results side by side")
        .requiredOption("-p, --projects <paths...>", "Paths to project results (format: name:path)")
        .requiredOption("-o, --output <path>", "Output directory for comparison report")
        .option("-v, --verbose", "Enable verbose output", false)
        .option("--use-agent", "Enable AI agent evaluation", false)
        .option("--provider <provider>", "LLM provider", "openrouter")
        .option("--api-key <key>", "API key for LLM provider")
        .action(async (options) => {
        await runCompare(options);
    });
    return program;
}
async function runCLI(options) {
    if (!options.apiKey) {
        options.apiKey = process.env.OPENROUTER_API_KEY;
    }
    if (!options.input) {
        p.log.error("--input is required");
        process.exit(1);
    }
    if (!options.output) {
        p.log.error("--output is required");
        process.exit(1);
    }
    if (options.useAgent && !options.apiKey) {
        p.log.error("--api-key is required when using --use-agent");
        p.log.info("Or set OPENROUTER_API_KEY environment variable");
        process.exit(1);
    }
    const inputPath = path.resolve(options.input);
    const outputPath = path.resolve(options.output);
    if (!fs.existsSync(inputPath)) {
        p.log.error(`Input path does not exist: ${inputPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    p.intro("🔍 AutoBE Code Evaluation");
    p.log.info(`Input: ${inputPath}`);
    p.log.info(`Output: ${outputPath}`);
    if (options.useAgent) {
        p.log.info(`Agent: ${options.provider} (AI evaluation enabled)`);
    }
    const spinner = p.spinner();
    spinner.start("Building evaluation context...");
    const input = {
        inputPath,
        outputPath,
        options: {
            continueOnGateFailure: options.continueOnGateFailure,
            runTests: options.runTests,
            golden: options.golden,
            project: options.project,
        },
    };
    const pipeline = new pipeline_1.EvaluationPipeline(options.verbose);
    const result = await pipeline.evaluate(input);
    spinner.stop("Evaluation complete");
    // Auto-fix
    const allFixableIssues = [...result.criticalIssues, ...result.warnings];
    if (options.autoFix && allFixableIssues.length > 0) {
        const { AutoFixer } = await Promise.resolve().then(() => __importStar(require("./fixers")));
        const fixer = new AutoFixer(options.verbose);
        const fixable = allFixableIssues.filter((i) => ["TS1161", "TS7006"].includes(i.code));
        if (fixable.length > 0) {
            p.log.info(`Found ${fixable.length} auto-fixable issue(s):`);
            for (const issue of fixable.slice(0, 5)) {
                const loc = issue.location
                    ? `${path.basename(issue.location.file)}:${issue.location.line}`
                    : "unknown";
                p.log.message(`  • [${issue.code}] ${issue.message} (${loc})`);
            }
            if (fixable.length > 5) {
                p.log.message(`  ... and ${fixable.length - 5} more`);
            }
            const confirm = await p.confirm({
                message: `Apply ${fixable.length} auto-fix(es) and re-evaluate?`,
            });
            if (p.isCancel(confirm) || !confirm) {
                p.log.info("Skipped auto-fix.");
            }
            else {
                const fixedPath = path.join(outputPath, "fixed");
                if (!fs.existsSync(fixedPath)) {
                    fs.cpSync(inputPath, fixedPath, { recursive: true });
                }
                for (const issue of allFixableIssues) {
                    if (issue.location?.file) {
                        issue.location.file = issue.location.file.replace(inputPath, fixedPath);
                    }
                }
                p.log.info("Running auto-fix on copy...");
                const fixResults = await fixer.fix(allFixableIssues);
                const fixed = fixResults.filter((r) => r.fixed).length;
                if (fixed > 0) {
                    p.log.success(`Auto-fixed ${fixed} issues in ${fixedPath}`);
                    p.log.info("Re-running evaluation on fixed copy...");
                    const fixedInput = {
                        ...input,
                        inputPath: fixedPath,
                    };
                    const reResult = await pipeline.evaluate(fixedInput);
                    Object.assign(result, reResult);
                }
                else {
                    p.log.info("No issues were actually fixed.");
                }
                p.log.info(`Original files untouched: ${inputPath}`);
            }
        }
        else {
            p.log.info("No auto-fixable issues found.");
        }
    }
    // Agent evaluations
    let agentResults = [];
    if (options.useAgent && options.apiKey) {
        const agentSpinner = p.spinner();
        agentSpinner.start("Running AI Agent Evaluations...");
        agentResults = await runAgentEvaluations(pipeline.getContext(), {
            provider: options.provider,
            apiKey: options.apiKey,
        }, options.verbose);
        agentSpinner.stop("AI Agent Evaluations complete");
    }
    // Reports
    const jsonPath = path.join(outputPath, "estimate-report.json");
    const mdPath = path.join(outputPath, "estimate-report.md");
    let adjustedScore = result.totalScore;
    let agentAvg = 0;
    if (agentResults.length > 0 && result.phases.gate.passed) {
        agentAvg = agentResults.reduce((sum, r) => {
            const w = types_1.AGENT_WEIGHTS[r.agent] || 1 / agentResults.length;
            return sum + r.score * w;
        }, 0);
        const phasesPortion = result.totalScore * (1 - types_1.AGENT_WEIGHT_RATIO);
        const agentPortion = agentAvg * types_1.AGENT_WEIGHT_RATIO;
        adjustedScore = Math.round(phasesPortion + agentPortion);
        // Cap score if agents found too many critical issues
        const totalAgentCritical = agentResults.reduce((sum, r) => sum +
            r.issues.filter((i) => i.severity === "critical")
                .length, 0);
        // No hard cap — let weighted average reflect real quality
        if (agentAvg < 40)
            adjustedScore = Math.min(adjustedScore, 60);
    }
    const fullResult = {
        ...result,
        totalScore: adjustedScore,
        grade: (0, types_1.scoreToGrade)(adjustedScore),
        agentEvaluations: agentResults,
        scoreBreakdown: {
            phaseScore: result.totalScore,
            phaseWeight: agentResults.length > 0 ? 0.7 : 1.0,
            phaseContribution: agentResults.length > 0
                ? Math.round(result.totalScore * (1 - types_1.AGENT_WEIGHT_RATIO))
                : result.totalScore,
            agentScore: agentResults.length > 0 ? Math.round(agentAvg) : null,
            agentWeight: agentResults.length > 0 ? 0.3 : 0,
            agentContribution: agentResults.length > 0 ? Math.round(agentAvg * types_1.AGENT_WEIGHT_RATIO) : 0,
        },
    };
    fs.writeFileSync(jsonPath, (0, reporters_1.generateJsonReport)(fullResult));
    fs.writeFileSync(mdPath, (0, reporters_1.generateMarkdownReport)(fullResult));
    printResults(fullResult);
    if (agentResults.length > 0) {
        printAgentResults(agentResults);
    }
    printFinalScore(fullResult, result.totalScore, agentAvg, agentResults.length > 0);
    p.log.success("Reports generated:");
    p.log.info(`  • ${mdPath}`);
    p.log.info(`  • ${jsonPath}`);
    // Flush Langfuse telemetry before exit
    await (0, telemetry_1.flushLangfuse)();
    p.outro(`Final Score: ${fullResult.totalScore}/100 (Grade: ${fullResult.grade})`);
}
async function runCompare(options) {
    const { CompareEvaluator, CompareReporter } = await Promise.resolve().then(() => __importStar(require("./compare")));
    if (!options.apiKey) {
        options.apiKey = process.env.OPENROUTER_API_KEY;
    }
    const projects = options.projects.map((proj) => {
        const sep = proj.indexOf(":");
        if (sep === -1) {
            return {
                name: path.basename(path.dirname(proj)),
                path: path.resolve(proj),
            };
        }
        return {
            name: proj.slice(0, sep),
            path: path.resolve(proj.slice(sep + 1)),
        };
    });
    p.intro("📊 AutoBE Model Comparison");
    p.log.info(`Comparing ${projects.length} projects`);
    for (const proj of projects) {
        p.log.info(`  • ${proj.name}: ${proj.path}`);
    }
    const evaluator = new CompareEvaluator(options.verbose);
    const result = await evaluator.compare({
        projects,
        outputPath: path.resolve(options.output),
        useAgent: options.useAgent,
        provider: options.provider,
        apiKey: options.apiKey,
        verbose: options.verbose,
    });
    const reporter = new CompareReporter();
    reporter.printToTerminal(result);
    const { mdPath, jsonPath } = reporter.saveReports(result, path.resolve(options.output));
    p.log.success("Reports saved:");
    p.log.info(`  • ${mdPath}`);
    p.log.info(`  • ${jsonPath}`);
    p.outro("Done!");
}
async function runAgentEvaluations(context, config, _verbose) {
    const securityAgent = new agents_1.SecurityAgent(config);
    const llmQualityAgent = new agents_1.LLMQualityAgent(config);
    const [securityResult, llmQualityResult] = await Promise.all([
        securityAgent.evaluate(context),
        llmQualityAgent.evaluate(context),
    ]);
    return [securityResult, llmQualityResult];
}
function printAgentResults(agentResults) {
    console.log("\n🤖 AI Agent Evaluations (30% of total score):");
    console.log("─────────────────────────────────────────");
    for (const result of agentResults) {
        const scoreEmoji = result.score >= 80 ? "✅" : result.score >= 60 ? "⚠️" : "❌";
        const criticalCount = result.issues.filter((i) => i.severity === "critical").length;
        const warningCount = result.issues.filter((i) => i.severity === "warning").length;
        console.log(`   ${result.agent}: ${result.score}/100 ${scoreEmoji}`);
        console.log(`      Issues: ${result.issues.length} (${criticalCount} critical, ${warningCount} warning)`);
        const summaryText = result.summary.length > 120
            ? result.summary.substring(0, 120) + "..."
            : result.summary;
        console.log(`      Summary: ${summaryText}`);
        console.log("");
    }
    console.log("─────────────────────────────────────────");
}
function printFinalScore(result, phaseScore, agentAvg, hasAgents) {
    const gradeEmoji = {
        A: "🏆",
        B: "👍",
        C: "📊",
        D: "⚠️",
        F: "❌",
    };
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`\n${gradeEmoji[result.grade] || "📊"} Final Score: ${result.totalScore}/100 (Grade: ${result.grade})\n`);
    if (!result.phases.gate.passed) {
        console.log(`   ❌ Gate Failed — Score forced to 0`);
        if (hasAgents && agentAvg > 0) {
            const wouldBe = Math.round(phaseScore * 0.7 + agentAvg * 0.3);
            console.log(`   (Reference: Phase ${phaseScore}, Agent ${Math.round(agentAvg)} → ~${wouldBe}/100 if gate passed)`);
        }
    }
    else if (hasAgents) {
        const rawTotal = Math.round(phaseScore * 0.7 + agentAvg * 0.3);
        console.log(`   Phase Score:  ${phaseScore}/100 × 70% = ${(phaseScore * 0.7).toFixed(1)}`);
        console.log(`   Agent Score:  ${Math.round(agentAvg)}/100 × 30% = ${(agentAvg * 0.3).toFixed(1)}`);
        if (result.totalScore < rawTotal) {
            console.log(`   ─────────────────────────────`);
            console.log(`   Subtotal:     ${rawTotal}/100`);
            console.log(`   ⚠️  Agent Critical Cap: → ${result.totalScore}/100 (${rawTotal - result.totalScore} point cap applied)`);
        }
        console.log(`   ─────────────────────────────`);
        console.log(`   Total:        ${result.totalScore}/100`);
    }
    else {
        console.log(`   Phase Score:  ${phaseScore}/100`);
        console.log(`\n   ⚠️  AI Agent evaluation disabled. Score may be inflated.`);
        console.log(`   Run with --use-agent for more accurate results.`);
    }
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
function printResults(result) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📋 Scoring Phases (70% of total score):");
    console.log("─────────────────────────────────────────");
    const gateStatus = result.phases.gate.passed ? "✅ Pass" : "❌ Fail";
    console.log(`   Gate:                    ${gateStatus}`);
    if (!result.phases.gate.passed && result.phases.gate.metrics?.reason) {
        const reason = String(result.phases.gate.metrics.reason);
        console.log(`   Reason:                  ${reason}`);
    }
    printPhaseScore("documentQuality", result.phases.documentQuality);
    printPhaseScore("requirementsCoverage", result.phases.requirementsCoverage);
    printPhaseScore("testCoverage", result.phases.testCoverage);
    printPhaseScore("logicCompleteness", result.phases.logicCompleteness);
    printPhaseScore("apiCompleteness", result.phases.apiCompleteness);
    console.log("─────────────────────────────────────────\n");
    console.log("📋 Reference Info (no score impact):");
    console.log("─────────────────────────────────────────");
    console.log(`   Complexity:    ${result.reference.complexity.complexFunctions} complex functions (max: ${result.reference.complexity.maxComplexity})`);
    console.log(`   Duplication:   ${result.reference.duplication.totalBlocks} duplicate blocks`);
    console.log(`   Naming:        ${result.reference.naming.totalIssues} issues`);
    console.log(`   JSDoc:         ${result.reference.jsdoc.totalMissing} missing`);
    console.log(`   Security:      ${result.reference.security.totalIssues} issues`);
    console.log("─────────────────────────────────────────\n");
    if (result.summary.criticalCount > 0) {
        console.log(`❌ Critical Issues: ${result.summary.criticalCount}`);
        console.log("   These must be fixed before production use.\n");
        printGroupedIssues(result.criticalIssues);
    }
    if (result.summary.warningCount > 0) {
        console.log(`⚠️  Warnings: ${result.summary.warningCount}`);
        console.log("   Top issues:\n");
        printGroupedIssues(result.warnings);
    }
    if (result.summary.suggestionCount > 0) {
        console.log(`💡 Suggestions: ${result.summary.suggestionCount}`);
        console.log("   Top issues:\n");
        printGroupedIssues(result.suggestions);
    }
}
function printGroupedIssues(issues) {
    const grouped = new Map();
    for (const issue of issues) {
        const existing = grouped.get(issue.code);
        const file = issue.location
            ? path.basename(issue.location.file)
            : "unknown";
        if (existing) {
            existing.count++;
            if (!existing.files.includes(file) && existing.files.length < 3) {
                existing.files.push(file);
            }
        }
        else {
            grouped.set(issue.code, {
                message: issue.message,
                count: 1,
                files: [file],
            });
        }
    }
    const sorted = [...grouped.entries()].sort((a, b) => b[1].count - a[1].count);
    for (const [code, info] of sorted.slice(0, 5)) {
        const fileHint = info.files.join(", ");
        const more = info.count > info.files.length ? " ..." : "";
        const msg = info.message.length > 100
            ? info.message.substring(0, 100) + "..."
            : info.message;
        console.log(`   • [${code}] ×${info.count} — ${msg}`);
        console.log(`     files: ${fileHint}${more}`);
    }
    if (sorted.length > 5) {
        console.log(`   ... and ${sorted.length - 5} more issue types\n`);
    }
    else {
        console.log("");
    }
}
function printPhaseScore(phase, phaseResult) {
    const phaseName = types_1.PHASE_NAMES[phase] || phase;
    const score = phaseResult.score;
    const padded = phaseName.padEnd(24);
    let indicator = "";
    if (phaseResult.metrics?.skipped) {
        indicator = "⏭️  Skipped";
    }
    else if (score >= 90) {
        indicator = `${score}/100 ✅`;
    }
    else if (score >= 70) {
        indicator = `${score}/100 📊`;
    }
    else if (score >= 50) {
        indicator = `${score}/100 ⚠️`;
    }
    else {
        indicator = `${score}/100 ❌`;
    }
    console.log(`   ${padded} ${indicator}`);
}
//# sourceMappingURL=cli.js.map