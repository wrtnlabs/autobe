import * as fs from 'fs';
import * as ts from 'typescript';
import { BaseEvaluator } from '../base';
import type { EvaluationContext, PhaseResult, Issue } from '../../types';
import { createIssue } from '../../types';

export class ApiCompletenessEvaluator extends BaseEvaluator {
  readonly name = 'ApiCompletenessEvaluator';
  readonly phase = 'apiCompleteness' as const;
  readonly description = 'Evaluates API implementation completeness';

  async evaluate(context: EvaluationContext): Promise<PhaseResult> {
    const startTime = performance.now();

    const results = await Promise.all(
      context.files.controllers.map(filePath => this.analyzeFile(filePath))
    );

    const issues = results.flatMap(r => r.issues);
    const totalEndpoints = results.reduce((sum, r) => sum + r.totalEndpoints, 0);
    const emptyEndpoints = results.reduce((sum, r) => sum + r.emptyEndpoints, 0);
    const implementedEndpoints = results.reduce((sum, r) => sum + r.implementedEndpoints, 0);

    let score = 0;

    if (totalEndpoints === 0) {
      score = 0;
      issues.push(createIssue({
        severity: 'critical',
        category: 'api',
        code: 'API002',
        message: 'No API endpoints found',
      }));
    } else {
      const nonEmptyRatio = (totalEndpoints - emptyEndpoints) / totalEndpoints;
      score += Math.round(nonEmptyRatio * 70);

      const implementationRatio = implementedEndpoints / totalEndpoints;
      score += Math.round(implementationRatio * 30);

      if (emptyEndpoints > 0) {
        issues.push(createIssue({
          severity: 'warning',
          category: 'api',
          code: 'API003',
          message: `${emptyEndpoints} of ${totalEndpoints} endpoints are empty`,
        }));
      }

      if (implementedEndpoints < totalEndpoints - emptyEndpoints) {
        const notImplemented = (totalEndpoints - emptyEndpoints) - implementedEndpoints;
        issues.push(createIssue({
          severity: 'suggestion',
          category: 'api',
          code: 'API004',
          message: `${notImplemented} endpoints may have incomplete implementation`,
        }));
      }
    }

    score = Math.min(100, Math.max(0, score));

    return {
      phase: 'apiCompleteness',
      passed: true,
      score,
      maxScore: 100,
      weightedScore: score * 0.15,
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        totalEndpoints,
        emptyEndpoints,
        implementedEndpoints,
        completionRate: totalEndpoints > 0 ? Math.round(((totalEndpoints - emptyEndpoints) / totalEndpoints) * 100) : 0,
        implementationRate: totalEndpoints > 0 ? Math.round((implementedEndpoints / totalEndpoints) * 100) : 0,
      },
    };
  }

  private async analyzeFile(filePath: string): Promise<{
    issues: Issue[];
    totalEndpoints: number;
    emptyEndpoints: number;
    implementedEndpoints: number;
  }> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

      const issues: Issue[] = [];
      let totalEndpoints = 0;
      let emptyEndpoints = 0;
      let implementedEndpoints = 0;

      const visit = (node: ts.Node) => {
        if (ts.isMethodDeclaration(node)) {
          const decorators = ts.getDecorators(node);
          if (decorators && decorators.length > 0) {
            totalEndpoints++;

            if (node.body) {
              const bodyText = node.body.getText(sourceFile).trim();
              
              if (bodyText === '{}' || bodyText.match(/^\{\s*\}$/)) {
                emptyEndpoints++;
                issues.push(createIssue({
                  severity: 'critical',
                  category: 'api',
                  code: 'API001',
                  message: `Empty endpoint: ${node.name?.getText(sourceFile)}`,
                  location: { file: filePath, line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 },
                }));
              } else {
                const hasImplementation = 
                  bodyText.includes('this.') ||
                  bodyText.includes('await') ||
                  bodyText.includes('return ') ||
                  bodyText.includes('Provider') ||
                  bodyText.includes('Service') ||
                  bodyText.match(/\w+\s*\(/);
                
                if (hasImplementation) {
                  implementedEndpoints++;
                }
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
      return { issues, totalEndpoints, emptyEndpoints, implementedEndpoints };
    } catch {
      return { issues: [], totalEndpoints: 0, emptyEndpoints: 0, implementedEndpoints: 0 };
    }
  }
}
