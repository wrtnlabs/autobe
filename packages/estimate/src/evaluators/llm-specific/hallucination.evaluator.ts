import * as ts from 'typescript';
import * as fs from 'fs';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class HallucinationEvaluator extends BaseEvaluator {
  readonly name = 'HallucinationEvaluator';
  readonly phase = 'llmSpecific' as const;
  readonly description = 'Detects hallucinated imports';

  // AutoBE 내부 패키지 허용 목록
  private readonly ALLOWED_PACKAGES = [
    '@prisma/sdk',
    '@prisma/client',
    '@nestia/core',
    '@nestia/fetcher',
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/testing',
    '@samchon/openapi',
  ];

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const issues: Issue[] = [];
    const startTime = performance.now();
    const knownPackages = new Set([
      ...Object.keys(context.dependencies.dependencies),
      ...Object.keys(context.dependencies.devDependencies),
      ...this.ALLOWED_PACKAGES,
    ]);

    const filesToCheck = [
      ...context.files.controllers,
      ...context.files.providers,
      ...context.files.structures,
    ];

    for (const filePath of filesToCheck) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileIssues = this.analyzeFile(filePath, content, knownPackages);
        issues.push(...fileIssues);
      } catch {
        // Skip
      }
    }

    const score = this.calculateScore(issues);

    return {
      phase: 'llmSpecific',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.1,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: { hallucinationIssues: issues.length },
    };
  }

  private analyzeFile(filePath: string, content: string, knownPackages: Set<string>): Issue[] {
    const issues: Issue[] = [];
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        if (!moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('@/')) {
          const packageName = this.getPackageName(moduleSpecifier);
          
          // Skip AutoBE generated placeholder packages
          if (this.isAutobePackage(packageName)) {
            return;
          }

          if (!this.isBuiltinModule(packageName) && !knownPackages.has(packageName)) {
            issues.push(
              createIssue({
                severity: 'critical',
                category: 'hallucination',
                code: 'H001',
                message: `Import "${packageName}" not found in package.json`,
                location: { file: filePath, line: line + 1 },
              })
            );
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return issues;
  }

  private getPackageName(moduleSpecifier: string): string {
    if (moduleSpecifier.startsWith('@')) {
      const parts = moduleSpecifier.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : moduleSpecifier;
    }
    return moduleSpecifier.split('/')[0];
  }

  private isBuiltinModule(name: string): boolean {
    const builtins = ['fs', 'path', 'http', 'https', 'url', 'util', 'os', 'crypto', 'stream', 'events', 'buffer', 'child_process', 'net', 'tls', 'assert', 'typia'];
    return builtins.includes(name) || name.startsWith('node:');
  }

  private isAutobePackage(name: string): boolean {
    // AutoBE placeholder patterns
    if (name.includes('ORGANIZATION') || name.includes('PROJECT')) {
      return true;
    }
    // Common AutoBE generated package patterns
    if (name.match(/@[a-z-]+\/[a-z-]+-api$/)) {
      return true;
    }
    return false;
  }
}
