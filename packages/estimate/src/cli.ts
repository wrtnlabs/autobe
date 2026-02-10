import * as path from 'path';
import * as fs from 'fs';
import { EvaluationPipeline } from './core/pipeline';
import { generateJsonReport, generateMarkdownReport } from './reporters';
import type { EvaluationInput, EvaluationResult, PhaseResult } from './types';
import { PHASE_NAMES } from './types';
import { SecurityAgent, LLMQualityAgent, AgentResult, LLMProvider } from './agents';

export interface CLIOptions {
  input: string;
  output: string;
  verbose?: boolean;
  continueOnGateFailure?: boolean;
  // NEW: Agent options
  useAgent?: boolean;
  provider?: LLMProvider;
  apiKey?: string;
}

export function parseOptions(args: string[]): CLIOptions {
  const options: CLIOptions = {
    input: '',
    output: '',
    verbose: false,
    continueOnGateFailure: false,
    useAgent: false,
    provider: 'openrouter',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--input':
      case '-i':
        options.input = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--continue-on-gate-failure':
        options.continueOnGateFailure = true;
        break;
      // NEW: Agent options
      case '--use-agent':
        options.useAgent = true;
        break;
      case '--provider':
        options.provider = args[++i] as LLMProvider;
        break;
      case '--api-key':
        options.apiKey = args[++i];
        break;
    }
  }

  // Check environment variables for API key
  if (!options.apiKey) {
  options.apiKey = process.env.OPENROUTER_API_KEY;
  }

  return options;
}

export function createCLI() {
  return {
    run: async (options: CLIOptions) => {
      await runCLI(options);
    },
  };
}

export async function runCLI(options: CLIOptions): Promise<void> {
  if (!options.input) {
    console.error('❌ Error: --input is required');
    process.exit(1);
  }
  if (!options.output) {
    console.error('❌ Error: --output is required');
    process.exit(1);
  }

  // Validate agent options
  if (options.useAgent && !options.apiKey) {
    console.error('❌ Error: --api-key is required when using --use-agent');
    console.error('   Or set OPENROUTER_API_KEY environment variable');;
    process.exit(1);
  }

  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input path does not exist: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  console.log('🔍 Starting AutoBE code evaluation');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  if (options.useAgent) {
    console.log(`   Agent: ${options.provider} (AI evaluation enabled)`);
  }
  console.log('');

  const input: EvaluationInput = {
    inputPath,
    outputPath,
    options: {
      continueOnGateFailure: options.continueOnGateFailure,
    },
  };

  const pipeline = new EvaluationPipeline(options.verbose);
  const result = await pipeline.evaluate(input);

  // NEW: Run agent evaluations if enabled
  let agentResults: AgentResult[] = [];
  if (options.useAgent && options.apiKey) {
    console.log('\n🤖 Running AI Agent Evaluations...');
    agentResults = await runAgentEvaluations(pipeline.getContext()!, {
      provider: options.provider!,
      apiKey: options.apiKey,
    }, options.verbose);
  }

  const jsonPath = path.join(outputPath, 'estimate-report.json');
  const mdPath = path.join(outputPath, 'estimate-report.md');

  // Add agent results to the report
  const fullResult = {
    ...result,
    agentEvaluations: agentResults,
  };

  fs.writeFileSync(jsonPath, generateJsonReport(fullResult));
  fs.writeFileSync(mdPath, generateMarkdownReport(fullResult));

  printResults(result);

  // Print agent results
  if (agentResults.length > 0) {
    printAgentResults(agentResults);
  }

  console.log('\n📄 Reports generated:');
  console.log(`   • ${mdPath}`);
  console.log(`   • ${jsonPath}`);
}

async function runAgentEvaluations(
  context: any,
  config: { provider: LLMProvider; apiKey: string },
  verbose?: boolean
): Promise<AgentResult[]> {
  const results: AgentResult[] = [];

  // Security Agent
  if (verbose) console.log('   - Running Security Agent...');
  const securityAgent = new SecurityAgent(config);
  const securityResult = await securityAgent.evaluate(context);
  results.push(securityResult);
  if (verbose) console.log(`     ✓ Security: ${securityResult.score}/100`);

  // LLM Quality Agent
  if (verbose) console.log('   - Running LLM Quality Agent...');
  const llmQualityAgent = new LLMQualityAgent(config);
  const llmQualityResult = await llmQualityAgent.evaluate(context);
  results.push(llmQualityResult);
  if (verbose) console.log(`     ✓ LLM Quality: ${llmQualityResult.score}/100`);

  return results;
}

function printAgentResults(agentResults: AgentResult[]): void {
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

function printResults(result: EvaluationResult): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const gradeEmoji: Record<string, string> = {
    A: '🏆',
    B: '👍',
    C: '📊',
    D: '⚠️',
    F: '❌',
  };

  console.log(`${gradeEmoji[result.grade]} Total Score: ${result.totalScore}/100 (Grade: ${result.grade})\n`);

  // Scoring phases
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

  // Reference info (no score impact)
  console.log('📋 Reference Info (no score impact):');
  console.log('─────────────────────────────────────────');
  console.log(`   Complexity:    ${result.reference.complexity.complexFunctions} complex functions (max: ${result.reference.complexity.maxComplexity})`);
  console.log(`   Duplication:   ${result.reference.duplication.totalBlocks} duplicate blocks`);
  console.log(`   Naming:        ${result.reference.naming.totalIssues} issues`);
  console.log(`   JSDoc:         ${result.reference.jsdoc.totalMissing} missing`);
  console.log(`   Security:      ${result.reference.security.totalIssues} issues`);
  console.log('─────────────────────────────────────────\n');

  // Critical Issues
  if (result.summary.criticalCount > 0) {
    console.log(`❌ Critical Issues: ${result.summary.criticalCount}`);
    console.log('   These must be fixed before production use.\n');
    for (const issue of result.criticalIssues.slice(0, 5)) {
      const location = issue.location ? ` (${path.basename(issue.location.file)}:${issue.location.line})` : '';
      console.log(`   • [${issue.code}] ${issue.message}${location}`);
      printIssueExplanation(issue.code);
    }
    if (result.criticalIssues.length > 5) {
      console.log(`   ... and ${result.criticalIssues.length - 5} more\n`);
    } else {
      console.log('');
    }
  }

  // Warnings
  if (result.summary.warningCount > 0) {
    console.log(`⚠️  Warnings: ${result.summary.warningCount}`);
    console.log('   These should be addressed to improve quality.\n');
    
    const warningsByCode = groupIssuesByCode(result.warnings);
    const topWarnings = Array.from(warningsByCode.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

    for (const [code, issues] of topWarnings) {
      console.log(`   • [${code}] ${issues[0].message} (${issues.length}x)`);
      printIssueExplanation(code);
    }
    console.log('');
  }

  // Suggestions
  if (result.summary.suggestionCount > 0) {
    console.log(`💡 Suggestions: ${result.summary.suggestionCount}`);
    console.log('   Optional improvements.\n');

    const suggestionsByCode = groupIssuesByCode(result.suggestions);
    const topSuggestions = Array.from(suggestionsByCode.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);

    for (const [code, issues] of topSuggestions) {
      console.log(`   • [${code}] ${issues[0].message} (${issues.length}x)`);
      printIssueExplanation(code);
    }
    console.log('');
  }
}

function printPhaseScore(phase: string, phaseResult: PhaseResult): void {
  const phaseName = PHASE_NAMES[phase as keyof typeof PHASE_NAMES] || phase;
  const score = phaseResult.score;
  const padded = phaseName.padEnd(24);

  let indicator = '';
  if (phaseResult.metrics?.skipped) {
    indicator = '⏭️  Skipped';
  } else if (score >= 90) {
    indicator = `${score}/100 ✅`;
  } else if (score >= 70) {
    indicator = `${score}/100 📊`;
  } else if (score >= 50) {
    indicator = `${score}/100 ⚠️`;
  } else {
    indicator = `${score}/100 ❌`;
  }

  console.log(`   ${padded} ${indicator}`);

  if (score < 80 && phaseResult.explanation && !phaseResult.metrics?.skipped) {
    const reasons = phaseResult.explanation.reasons.slice(0, 3);
    for (const reason of reasons) {
      console.log(`      └─ ${reason}`);
    }
  }
}

function groupIssuesByCode(issues: { code: string; message: string }[]): Map<string, typeof issues> {
  const grouped = new Map<string, typeof issues>();
  for (const issue of issues) {
    const existing = grouped.get(issue.code) || [];
    existing.push(issue);
    grouped.set(issue.code, existing);
  }
  return grouped;
}

function printIssueExplanation(code: string): void {
  const explanations: Record<string, string> = {
    // Documentation
    'DOC001': '      → No documentation found, add docs/analysis/ or README.md',
    'DOC002': '      → Add docs/analysis/ folder with requirements',
    'DOC003': '      → Add README.md file',
    'DOC004': '      → Add more detailed documentation',
    
    // Requirements
    'REQ001': '      → No controllers found, API endpoints not implemented',
    'REQ002': '      → No providers found, business logic not implemented',
    'REQ003': '      → No DTOs found, add structures',
    'REQ004': '      → Add requirements documents in docs/analysis/',
    
    // Test
    'TEST001': '      → No tests found, add test files',
    'TEST002': '      → Add more tests to improve coverage',
    
    // Logic
    'LOGIC001': '      → Replace "not implemented" with actual implementation',
    'LOGIC002': '      → Complete the TODO item',
    'LOGIC003': '      → Fix the known bug marked with FIXME',
    'LOGIC004': '      → Clean up the HACK',
    'LOGIC005': '      → Implement the placeholder',
    
    // API
    'API001': '      → Implement the empty endpoint',
    'API002': '      → Add API endpoints',
    'API003': '      → Some endpoints are empty, implement them',
  };

  if (explanations[code]) {
    console.log(explanations[code]);
  }
}
