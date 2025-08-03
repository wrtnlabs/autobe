/**
 * Context optimization utilities for RAG-based token reduction.
 * 
 * This module provides functions to intelligently filter and optimize
 * context sent to LLMs, dramatically reducing token consumption while
 * maintaining test generation quality.
 */

import { AutoBeOpenApi, AutoBeTestScenario } from "@autobe/interface";
import { SemanticSimilarity } from "./SemanticSimilarity";

export interface IOptimizedContext {
  /**
   * Filtered operations relevant to the scenario
   */
  operations: AutoBeOpenApi.IOperation[];
  
  /**
   * Filtered schema definitions
   */
  schemas: Record<string, any>;
  
  /**
   * SDK function signatures for the filtered operations
   */
  sdkFunctions: Record<string, any>;
  
  /**
   * E2E test examples for reference (if available)
   */
  e2eExamples?: Record<string, any>;
  
  /**
   * Statistics about the optimization
   */
  stats: {
    originalOperations: number;
    filteredOperations: number;
    originalSchemas: number;
    filteredSchemas: number;
    estimatedTokenReduction: number;
  };
}

export interface IContextOptimizationOptions {
  /**
   * Maximum number of operations to include
   */
  maxOperations?: number;
  
  /**
   * Maximum number of schemas to include
   */
  maxSchemas?: number;
  
  /**
   * Minimum similarity score for operations
   */
  minOperationScore?: number;
  
  /**
   * Whether to include related schemas
   */
  includeRelatedSchemas?: boolean;
  
  /**
   * Whether to prioritize dependencies
   */
  prioritizeDependencies?: boolean;
  
  /**
   * Whether to enable aggressive optimization
   */
  aggressiveMode?: boolean;
}

/**
 * Optimize context for test scenario generation using RAG techniques
 */
export namespace ContextOptimizer {
  /**
   * Optimize context for a single test scenario
   */
  export function optimizeForScenario(
    scenario: AutoBeTestScenario,
    fullDocument: AutoBeOpenApi.IDocument,
    fullSdkFunctions: Record<string, any>,
    fullE2eExamples: Record<string, any>,
    options: IContextOptimizationOptions = {}
  ): IOptimizedContext {
    const {
      maxOperations = 20,
      maxSchemas = 50,
      minOperationScore = 0.1,
      includeRelatedSchemas = true,
      aggressiveMode = false
    } = options;

    // Convert operations for semantic scoring
    const operationsForScoring = fullDocument.operations.map(op => ({
      method: op.method,
      path: op.path,
      summary: op.summary || "",
      tags: (op as any).tags || []
    }));

    // Score and filter operations
    const operationScores = SemanticSimilarity.scoreOperations(
      scenario,
      operationsForScoring,
      {
        maxResults: maxOperations,
        minScore: minOperationScore
      }
    );

    // Get the filtered operations
    const relevantOperations = operationScores.map(score => 
      fullDocument.operations.find(op => 
        op.method === score.item.method && op.path === score.item.path
      )!
    );

    // Score and filter schemas based on selected operations
    const compatibleOperations = relevantOperations.map(op => ({
      requestBody: op.requestBody,
      responseBody: op.responseBody,
      path: op.path
    }));
    
    const schemaScores = SemanticSimilarity.scoreSchemas(
      compatibleOperations,
      fullDocument.components.schemas,
      {
        maxResults: maxSchemas,
        includeRelated: includeRelatedSchemas
      }
    );

    // Build optimized schemas object
    const optimizedSchemas: Record<string, any> = {};
    schemaScores.forEach(score => {
      optimizedSchemas[score.item.name] = score.item.schema;
    });

    // Filter SDK functions based on selected operations
    const optimizedSdkFunctions = filterSdkFunctions(
      relevantOperations,
      fullSdkFunctions
    );

    // Filter E2E examples if available
    const optimizedE2eExamples = filterE2eExamples(
      relevantOperations,
      fullE2eExamples,
      aggressiveMode
    );

    // Calculate statistics
    const stats = {
      originalOperations: fullDocument.operations.length,
      filteredOperations: relevantOperations.length,
      originalSchemas: Object.keys(fullDocument.components.schemas).length,
      filteredSchemas: Object.keys(optimizedSchemas).length,
      estimatedTokenReduction: calculateTokenReduction(
        fullDocument.operations.length,
        relevantOperations.length,
        Object.keys(fullDocument.components.schemas).length,
        Object.keys(optimizedSchemas).length
      )
    };

    return {
      operations: relevantOperations,
      schemas: optimizedSchemas,
      sdkFunctions: optimizedSdkFunctions,
      e2eExamples: optimizedE2eExamples,
      stats
    };
  }

  /**
   * Optimize context for multiple test scenarios (batch optimization)
   */
  export function optimizeForScenarios(
    scenarios: AutoBeTestScenario[],
    fullDocument: AutoBeOpenApi.IDocument,
    fullSdkFunctions: Record<string, any>,
    fullE2eExamples: Record<string, any>,
    options: IContextOptimizationOptions = {}
  ): IOptimizedContext {
    const {
      maxOperations = 50,
      maxSchemas = 100,
      minOperationScore = 0.05
    } = options;

    // Collect all unique endpoints from scenarios
    const scenarioEndpoints = new Set<string>();
    const dependencyEndpoints = new Set<string>();
    
    scenarios.forEach(scenario => {
      scenarioEndpoints.add(`${scenario.endpoint.method}:${scenario.endpoint.path}`);
      scenario.dependencies?.forEach(dep => {
        dependencyEndpoints.add(`${dep.endpoint.method}:${dep.endpoint.path}`);
      });
    });

    // Score operations based on all scenarios
    const operationScores = new Map<string, number>();
    const operationReasons = new Map<string, string[]>();
    
    scenarios.forEach(scenario => {
      const operationsForScoring = fullDocument.operations.map(op => ({
        method: op.method,
        path: op.path,
        summary: op.summary || "",
        tags: (op as any).tags || []
      }));

      const scores = SemanticSimilarity.scoreOperations(
        scenario,
        operationsForScoring,
        { maxResults: 100, minScore: 0.01 }
      );

      scores.forEach(score => {
        const key = `${score.item.method}:${score.item.path}`;
        const currentScore = operationScores.get(key) || 0;
        operationScores.set(key, Math.max(currentScore, score.score));
        
        if (!operationReasons.has(key)) {
          operationReasons.set(key, []);
        }
        operationReasons.get(key)!.push(score.reason || "");
      });
    });

    // Select top operations
    const sortedOperations = Array.from(operationScores.entries())
      .filter(([_, score]) => score >= minOperationScore)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxOperations);

    const relevantOperations = sortedOperations
      .map(([key, _]) => {
        const [method, path] = key.split(':');
        return fullDocument.operations.find(op => 
          op.method === method && op.path === path
        )!;
      })
      .filter(op => op !== undefined);

    // Get schemas for selected operations
    const compatibleOperations = relevantOperations.map(op => ({
      requestBody: op.requestBody,
      responseBody: op.responseBody,
      path: op.path
    }));
    
    const schemaScores = SemanticSimilarity.scoreSchemas(
      compatibleOperations,
      fullDocument.components.schemas,
      {
        maxResults: maxSchemas,
        includeRelated: true
      }
    );

    const optimizedSchemas: Record<string, any> = {};
    schemaScores.forEach(score => {
      optimizedSchemas[score.item.name] = score.item.schema;
    });

    // Filter other artifacts
    const optimizedSdkFunctions = filterSdkFunctions(
      relevantOperations,
      fullSdkFunctions
    );

    const optimizedE2eExamples = filterE2eExamples(
      relevantOperations,
      fullE2eExamples,
      true
    );

    const stats = {
      originalOperations: fullDocument.operations.length,
      filteredOperations: relevantOperations.length,
      originalSchemas: Object.keys(fullDocument.components.schemas).length,
      filteredSchemas: Object.keys(optimizedSchemas).length,
      estimatedTokenReduction: calculateTokenReduction(
        fullDocument.operations.length,
        relevantOperations.length,
        Object.keys(fullDocument.components.schemas).length,
        Object.keys(optimizedSchemas).length
      )
    };

    return {
      operations: relevantOperations,
      schemas: optimizedSchemas,
      sdkFunctions: optimizedSdkFunctions,
      e2eExamples: optimizedE2eExamples,
      stats
    };
  }
}

/**
 * Filter SDK functions based on selected operations
 */
function filterSdkFunctions(
  operations: AutoBeOpenApi.IOperation[],
  fullSdkFunctions: Record<string, any>
): Record<string, any> {
  const operationPaths = new Set(
    operations.map(op => `${op.method.toLowerCase()}:${op.path}`)
  );
  
  const filtered: Record<string, any> = {};
  
  // Recursively filter SDK functions
  function filterLevel(source: any, target: any, path: string = "") {
    if (typeof source !== 'object' || source === null) {
      return source;
    }
    
    Object.keys(source).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const value = source[key];
      
      if (typeof value === 'object' && value !== null) {
        if (value.METADATA && value.METADATA.method && value.METADATA.path) {
          // This looks like an SDK function with metadata
          const opKey = `${value.METADATA.method.toLowerCase()}:${value.METADATA.path}`;
          if (operationPaths.has(opKey)) {
            if (!target[key]) target[key] = {};
            target[key] = value;
          }
        } else {
          // This is a nested object, recurse
          if (!target[key]) target[key] = {};
          filterLevel(value, target[key], currentPath);
          
          // Remove empty objects
          if (Object.keys(target[key]).length === 0) {
            delete target[key];
          }
        }
      }
    });
  }
  
  filterLevel(fullSdkFunctions, filtered);
  return filtered;
}

/**
 * Filter E2E examples based on selected operations
 */
function filterE2eExamples(
  operations: AutoBeOpenApi.IOperation[],
  fullE2eExamples: Record<string, any>,
  aggressiveMode: boolean
): Record<string, any> {
  if (!aggressiveMode) {
    // In non-aggressive mode, include more examples for reference
    return fullE2eExamples;
  }
  
  const operationPaths = new Set(
    operations.map(op => `${op.method}:${op.path}`)
  );
  
  const filtered: Record<string, any> = {};
  
  Object.keys(fullE2eExamples).forEach(key => {
    const content = fullE2eExamples[key];
    
    // Check if this example is related to any of our operations
    const isRelevant = operationPaths.size === 0 || 
      Array.from(operationPaths).some(opPath => 
        content.includes(opPath.split(':')[1]) || // Check if path is mentioned
        key.toLowerCase().includes(opPath.split(':')[1].split('/').pop() || '')
      );
    
    if (isRelevant) {
      filtered[key] = content;
    }
  });
  
  return filtered;
}

/**
 * Calculate estimated token reduction percentage
 */
function calculateTokenReduction(
  originalOps: number,
  filteredOps: number,
  originalSchemas: number,
  filteredSchemas: number
): number {
  // Rough estimation based on typical content sizes
  const opTokens = originalOps * 150; // ~150 tokens per operation
  const schemaTokens = originalSchemas * 80; // ~80 tokens per schema
  const totalOriginal = opTokens + schemaTokens;
  
  const filteredOpTokens = filteredOps * 150;
  const filteredSchemaTokens = filteredSchemas * 80;
  const totalFiltered = filteredOpTokens + filteredSchemaTokens;
  
  if (totalOriginal === 0) return 0;
  
  return Math.round(((totalOriginal - totalFiltered) / totalOriginal) * 100);
}