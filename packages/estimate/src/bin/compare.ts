#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import { CompareEvaluator } from '../compare/CompareEvaluator';
import { CompareReporter } from '../compare/CompareReporter';
import type { CompareInput, ProjectInput } from '../compare/types';

interface CompareCLIOptions {
  projectA: string;
  projectB: string;
  projectC?: string;
  nameA?: string;
  nameB?: string;
  nameC?: string;
  output: string;
  useAgent?: boolean;
  provider?: string;
  verbose?: boolean;
}

function createCompareProgram(): Command {
  const program = new Command();

  program
    .name('compare')
    .description('Compare 2-3 projects (evaluates if needed, or uses existing reports)')
    .version('0.2.0')
    .requiredOption('-a, --project-a <path>', 'Path to first project or report')
    .requiredOption('-b, --project-b <path>', 'Path to second project or report')
    .option('-c, --project-c <path>', 'Path to third project or report (optional)')
    .option('--name-a <name>', 'Display name for project A', 'Project A')
    .option('--name-b <name>', 'Display name for project B', 'Project B')
    .option('--name-c <name>', 'Display name for project C', 'Project C')
    .requiredOption('-o, --output <path>', 'Output directory for reports')
    .option('--use-agent', 'Enable AI agent evaluation', false)
    .option('--provider <provider>', 'LLM provider (openrouter)', 'openrouter')
    .option('-v, --verbose', 'Enable verbose output', false)
    .action(async (options) => {
      await runCompare(options);
    });

  return program;
}

async function runCompare(options: CompareCLIOptions): Promise<void> {
  // Validate paths
  const projectAPath = path.resolve(options.projectA);
  const projectBPath = path.resolve(options.projectB);
  const projectCPath = options.projectC ? path.resolve(options.projectC) : undefined;
  const outputPath = path.resolve(options.output);

  if (!fs.existsSync(projectAPath)) {
    p.log.error(`Project A path does not exist: ${projectAPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(projectBPath)) {
    p.log.error(`Project B path does not exist: ${projectBPath}`);
    process.exit(1);
  }
  if (projectCPath && !fs.existsSync(projectCPath)) {
    p.log.error(`Project C path does not exist: ${projectCPath}`);
    process.exit(1);
  }

  // Build projects array
  const projects: ProjectInput[] = [
    { path: projectAPath, name: options.nameA || 'Project A' },
    { path: projectBPath, name: options.nameB || 'Project B' },
  ];

  if (projectCPath) {
    projects.push({ path: projectCPath, name: options.nameC || 'Project C' });
  }

  // Intro
  p.intro(`📊 AutoBE Project Comparison (${projects.length} projects)`);
  
  for (let i = 0; i < projects.length; i++) {
    const label = String.fromCharCode(65 + i);
    p.log.info(`Project ${label}: ${projects[i].name} (${projects[i].path})`);
  }
  
  p.log.info(`Output: ${outputPath}`);
  
  if (options.useAgent) {
    p.log.info(`Agent: ${options.provider} (AI evaluation enabled)`);
  }

  const spinner = p.spinner();
  spinner.start('Processing projects...');

  try {
    const input: CompareInput = {
      projects,
      outputPath,
      useAgent: options.useAgent,
      provider: options.provider,
      apiKey: process.env.OPENROUTER_API_KEY,
      verbose: options.verbose,
    };

    const evaluator = new CompareEvaluator(options.verbose);
    const result = await evaluator.compare(input);

    spinner.stop('Comparison complete');

    // Print to terminal
    const reporter = new CompareReporter();
    reporter.printToTerminal(result);

    // Save reports
    const { mdPath, jsonPath } = reporter.saveReports(result, outputPath);

    p.note(`Reports generated:\n  • ${mdPath}\n  • ${jsonPath}`);
    p.outro(`Winner: ${result.summary.overallWinner} (${result.ranking[0].score}/100)`);

  } catch (error) {
    spinner.stop('Comparison failed');
    p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
createCompareProgram().parse();
