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
    const issues: Issue[] = [];
    const startTime = performance.now();

    let totalEndpoints = 0;
    let emptyEndpoints = 0;
    let implementedEndpoints = 0;

    // Analyze controllers
    for (const filePath of context.files.controllers) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

        // Count methods with decorators (likely endpoints)
        const visit = (node: ts.Node) => {
          if (ts.isMethodDeclaration(node)) {
            const decorators = ts.getDecorators(node);
            if (decorators && decorators.length > 0) {
              totalEndpoints++;

              if (node.body) {
                const bodyText = node.body.getText(sourceFile).trim();
                
                // Check if method body is empty
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
                  // Check if it has actual implementation
                  // Look for: this.xxx, await, return with value, function calls
                  const hasImplementation = 
                    bodyText.includes('this.') ||
                    bodyText.includes('await') ||
                    bodyText.includes('return ') ||
                    bodyText.includes('Provider') ||
                    bodyText.includes('Service') ||
                    bodyText.match(/\w+\s*\(/); // function call
                  
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

      } catch {
        // Skip
      }
    }

    // Calculate score
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
      // Non-empty ratio (70% weight)
      const nonEmptyRatio = (totalEndpoints - emptyEndpoints) / totalEndpoints;
      score += Math.round(nonEmptyRatio * 70);

      // Implementation quality (30% weight)
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

      // Add info if not all endpoints have proper implementation
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
}
