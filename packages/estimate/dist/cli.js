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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const commander_1 = require("commander");
const p = __importStar(require("@clack/prompts"));
const pipeline_1 = require("./core/pipeline");
const reporters_1 = require("./reporters");
const types_1 = require("./types");
const agents_1 = require("./agents");
function createProgram() {
    const program = new commander_1.Command();
    program
        .name('estimate')
        .description('Evaluate AutoBE generated code quality')
        .version('0.2.0')
        .requiredOption('-i, --input <path>', 'Input project path')
        .requiredOption('-o, --output <path>', 'Output directory for reports')
        .option('-v, --verbose', 'Enable verbose output (default: false)', false)
        .option('--continue-on-gate-failure', 'Continue evaluation even if gate fails (default: false)', false)
        .option('--use-agent', 'Enable AI agent evaluation (default: false)', false)
        .option('--provider <provider>', 'LLM provider (default: openrouter)', 'openrouter')
        .option('--api-key <key>', 'API key for LLM provider')
        .action(async (options) => {
        await runCLI(options);
    });
    return program;
}
async function runCLI(options) {
    // Check for API key in environment if not provided
    if (!options.apiKey) {
        options.apiKey = process.env.OPENROUTER_API_KEY;
    }
    // Validate required options
    if (!options.input) {
        p.log.error('--input is required');
        process.exit(1);
    }
    if (!options.output) {
        p.log.error('--output is required');
        process.exit(1);
    }
    if (options.useAgent && !options.apiKey) {
        p.log.error('--api-key is required when using --use-agent');
        p.log.info('Or set OPENROUTER_API_KEY environment variable');
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
    p.intro('🔍 AutoBE Code Evaluation');
    p.log.info(`Input: ${inputPath}`);
    p.log.info(`Output: ${outputPath}`);
    if (options.useAgent) {
        p.log.info(`Agent: ${options.provider} (AI evaluation enabled)`);
    }
    const spinner = p.spinner();
    spinner.start('Building evaluation context...');
    const input = {
        inputPath,
        outputPath,
        options: {
            continueOnGateFailure: options.continueOnGateFailure,
        },
    };
    const pipeline = new pipeline_1.EvaluationPipeline(options.verbose);
    const result = await pipeline.evaluate(input);
    spinner.stop('Evaluation complete');
    // Run agent evaluations if enabled
    let agentResults = [];
    if (options.useAgent && options.apiKey) {
        const agentSpinner = p.spinner();
        agentSpinner.start('Running AI Agent Evaluations...');
        agentResults = await runAgentEvaluations(pipeline.getContext(), {
            provider: options.provider,
            apiKey: options.apiKey,
        }, options.verbose);
        agentSpinner.stop('AI Agent Evaluations complete');
    }
    // Generate reports
    const jsonPath = path.join(outputPath, 'estimate-report.json');
    const mdPath = path.join(outputPath, 'estimate-report.md');
    const fullResult = {
        ...result,
        agentEvaluations: agentResults,
    };
    fs.writeFileSync(jsonPath, (0, reporters_1.generateJsonReport)(fullResult));
    fs.writeFileSync(mdPath, (0, reporters_1.generateMarkdownReport)(fullResult));
    // Print results
    printResults(result);
    if (agentResults.length > 0) {
        printAgentResults(agentResults);
    }
    p.log.success(`Reports generated:`);
    p.log.info(`  • ${mdPath}`);
    p.log.info(`  • ${jsonPath}`);
    p.outro(`Score: ${result.totalScore}/100 (Grade: ${result.grade})`);
}
async function runAgentEvaluations(context, config, verbose) {
    const results = [];
    const securityAgent = new agents_1.SecurityAgent(config);
    const securityResult = await securityAgent.evaluate(context);
    results.push(securityResult);
    const llmQualityAgent = new agents_1.LLMQualityAgent(config);
    const llmQualityResult = await llmQualityAgent.evaluate(context);
    results.push(llmQualityResult);
    return results;
}
function printAgentResults(agentResults) {
    console.log('\n🤖 AI Agent Evaluations (Reference Only):');
    console.log('─────────────────────────────────────────');
    for (const result of agentResults) {
        const scoreEmoji = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌';
        console.log(`   ${result.agent}: ${result.score}/100 ${scoreEmoji}`);
        console.log(`      Provider: ${result.provider} | Model: ${result.model}`);
        console.log(`      Summary: ${result.summary}`);
        if (result.tokensUsed) {
            console.log(`      Tokens: ${result.tokensUsed.input} in / ${result.tokensUsed.output} out`);
        }
        if (result.issues.length > 0) {
            console.log(`      Issues found: ${result.issues.length}`);
            for (const issue of result.issues.slice(0, 3)) {
                console.log(`         • [${issue.severity}] ${issue.description}`);
            }
            if (result.issues.length > 3) {
                console.log(`         ... and ${result.issues.length - 3} more`);
            }
        }
        console.log('');
    }
    console.log('─────────────────────────────────────────');
}
function printResults(result) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const gradeEmoji = {
        A: '🏆',
        B: '👍',
        C: '📊',
        D: '⚠️',
        F: '❌',
    };
    console.log(`${gradeEmoji[result.grade]} Total Score: ${result.totalScore}/100 (Grade: ${result.grade})\n`);
    console.log('📋 Scoring Phases (affects total score):');
    console.log('─────────────────────────────────────────');
    const gateStatus = result.phases.gate.passed ? '✅ Pass' : '❌ Fail';
    console.log(`   Gate:                    ${gateStatus}`);
    printPhaseScore('documentQuality', result.phases.documentQuality);
    printPhaseScore('requirementsCoverage', result.phases.requirementsCoverage);
    printPhaseScore('testCoverage', result.phases.testCoverage);
    printPhaseScore('logicCompleteness', result.phases.logicCompleteness);
    printPhaseScore('apiCompleteness', result.phases.apiCompleteness);
    console.log('─────────────────────────────────────────\n');
    console.log('📋 Reference Info (no score impact):');
    console.log('─────────────────────────────────────────');
    console.log(`   Complexity:    ${result.reference.complexity.complexFunctions} complex functions (max: ${result.reference.complexity.maxComplexity})`);
    console.log(`   Duplication:   ${result.reference.duplication.totalBlocks} duplicate blocks`);
    console.log(`   Naming:        ${result.reference.naming.totalIssues} issues`);
    console.log(`   JSDoc:         ${result.reference.jsdoc.totalMissing} missing`);
    console.log(`   Security:      ${result.reference.security.totalIssues} issues`);
    console.log('─────────────────────────────────────────\n');
    if (result.summary.criticalCount > 0) {
        console.log(`❌ Critical Issues: ${result.summary.criticalCount}`);
        console.log('   These must be fixed before production use.\n');
        for (const issue of result.criticalIssues.slice(0, 5)) {
            const location = issue.location ? ` (${path.basename(issue.location.file)}:${issue.location.line})` : '';
            console.log(`   • [${issue.code}] ${issue.message}${location}`);
        }
        if (result.criticalIssues.length > 5) {
            console.log(`   ... and ${result.criticalIssues.length - 5} more\n`);
        }
        else {
            console.log('');
        }
    }
    if (result.summary.warningCount > 0) {
        console.log(`⚠️  Warnings: ${result.summary.warningCount}`);
        console.log('   These should be addressed to improve quality.\n');
    }
    if (result.summary.suggestionCount > 0) {
        console.log(`💡 Suggestions: ${result.summary.suggestionCount}`);
        console.log('   Optional improvements.\n');
    }
}
function printPhaseScore(phase, phaseResult) {
    const phaseName = types_1.PHASE_NAMES[phase] || phase;
    const score = phaseResult.score;
    const padded = phaseName.padEnd(24);
    let indicator = '';
    if (phaseResult.metrics?.skipped) {
        indicator = '⏭️  Skipped';
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