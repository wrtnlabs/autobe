/**
 * Context optimization utilities for RAG-based token reduction across all AutoBE workflow stages.
 * 
 * This module provides functions to intelligently filter and optimize
 * context sent to LLMs, dramatically reducing token consumption while
 * maintaining generation quality for Prisma, Interface, Test, and Realize workflows.
 */

import { AutoBeOpenApi, AutoBeTestScenario } from "@autobe/interface";
import { SemanticSimilarity, WorkflowStage, IWorkflowContext } from "./SemanticSimilarity";
import { IRagConfig, DEFAULT_RAG_CONFIG } from "./RagConfig";
import { PromptOptimizer } from "./PromptOptimizer";

export interface IOptimizedContext {
  /**
   * Filtered operations relevant to the current context
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
   * Optimized system prompt for current stage
   */
  systemPrompt?: string;
  
  /**
   * Historical context from previous stages (filtered)
   */
  history?: any[];
  
  /**
   * Statistics about the optimization
   */
  stats: {
    originalOperations: number;
    filteredOperations: number;
    originalSchemas: number;
    filteredSchemas: number;
    originalPromptLength?: number;
    optimizedPromptLength?: number;
    estimatedTokenReduction: number;
  };
}

export interface IStageOptimizationOptions {
  /**
   * Current workflow stage
   */
  stage: WorkflowStage;
  
  /**
   * Current operation context
   */
  currentOperation?: any;
  
  /**
   * Requirements from analysis stage
   */
  requirements?: string;
  
  /**
   * System prompt to optimize
   */
  systemPrompt?: string;
  
  /**
   * Previous stage results for context inheritance
   */
  previousResults?: any;
  
  /**
   * Maximum number of items to include per type
   */
  maxItems?: {
    operations?: number;
    schemas?: number;
    history?: number;
  };
  
  /**
   * Similarity thresholds
   */
  thresholds?: {
    operations?: number;
    schemas?: number;
    history?: number;
  };
  
  /**
   * RAG configuration override
   */
  ragConfig?: IRagConfig;
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
   * Whether to enable aggressive optimization
   */
  aggressiveMode?: boolean;
  
  /**
   * RAG configuration to use (overrides individual options)
   */
  ragConfig?: IRagConfig;
}

/**
 * Stage-aware context optimization for AutoBE workflow
 */
export namespace ContextOptimizer {
  /**
   * Optimize context for any workflow stage
   */
  export function optimizeForStage(
    options: IStageOptimizationOptions,
    fullDocument?: AutoBeOpenApi.IDocument,
    fullSdkFunctions?: Record<string, any>,
    fullE2eExamples?: Record<string, any>
  ): IOptimizedContext {
    const context: IWorkflowContext = {
      stage: options.stage,
      currentOperation: options.currentOperation,
      requirements: options.requirements,
      schemas: fullDocument?.components?.schemas,
      operations: fullDocument?.operations
    };
    
    // Initialize result
    let operations: AutoBeOpenApi.IOperation[] = [];
    let schemas: Record<string, any> = {};
    let sdkFunctions: Record<string, any> = {};
    let e2eExamples: Record<string, any> = {};
    let history: any[] = [];
    let systemPrompt: string | undefined;
    
    // Stage-specific optimization
    switch (options.stage) {
      case 'prisma':
        ({ operations, schemas, history } = optimizePrismaContext(context, options, fullDocument));
        break;
      case 'interface':
        ({ operations, schemas, sdkFunctions, history } = optimizeInterfaceContext(context, options, fullDocument, fullSdkFunctions));
        break;
      case 'test':
        ({ operations, schemas, sdkFunctions, e2eExamples, history } = optimizeTestContext(context, options, fullDocument, fullSdkFunctions, fullE2eExamples));
        break;
      case 'realize':
        ({ operations, schemas, sdkFunctions, e2eExamples, history } = optimizeRealizeContext(context, options, fullDocument, fullSdkFunctions, fullE2eExamples));
        break;
      default:
        // Fallback to generic optimization
        operations = fullDocument?.operations || [];
        schemas = fullDocument?.components?.schemas || {};
        sdkFunctions = fullSdkFunctions || {};
        e2eExamples = fullE2eExamples || {};
    }
    
    // Optimize system prompt if provided
    let originalPromptLength: number | undefined;
    let optimizedPromptLength: number | undefined;
    
    if (options.systemPrompt) {
      const promptOptimization = PromptOptimizer.optimizeForStage(
        options.systemPrompt,
        options.stage,
        options.currentOperation
      );
      systemPrompt = promptOptimization.content;
      originalPromptLength = promptOptimization.originalLength;
      optimizedPromptLength = promptOptimization.optimizedLength;
    }
    
    // Calculate statistics
    const stats = {
      originalOperations: fullDocument?.operations?.length || 0,
      filteredOperations: operations.length,
      originalSchemas: Object.keys(fullDocument?.components?.schemas || {}).length,
      filteredSchemas: Object.keys(schemas).length,
      originalPromptLength,
      optimizedPromptLength,
      estimatedTokenReduction: calculateStageTokenReduction(
        fullDocument?.operations?.length || 0,
        operations.length,
        Object.keys(fullDocument?.components?.schemas || {}).length,
        Object.keys(schemas).length,
        originalPromptLength,
        optimizedPromptLength
      )
    };
    
    return {
      operations,
      schemas,
      sdkFunctions,
      e2eExamples,
      systemPrompt,
      history,
      stats
    };
  }

  /**
   * Optimize context for a single test scenario (backward compatibility)
   */
  export function optimizeForScenario(
    scenario: AutoBeTestScenario,
    fullDocument: AutoBeOpenApi.IDocument,
    fullSdkFunctions: Record<string, any>,
    fullE2eExamples: Record<string, any>,
    options: IContextOptimizationOptions = {}
  ): IOptimizedContext {
    // Use RAG config if provided, otherwise use individual options or defaults
    const config = options.ragConfig || DEFAULT_RAG_CONFIG;
    
    const {
      maxOperations = options.maxOperations || config.maxOperationsPerScenario,
      maxSchemas = options.maxSchemas || config.maxSchemas,
      minOperationScore = options.minOperationScore || config.minSimilarityScore,
      includeRelatedSchemas = options.includeRelatedSchemas ?? true,
      aggressiveMode = options.aggressiveMode ?? config.aggressiveMode
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

/**
 * Calculate token reduction including prompt optimization
 */
function calculateStageTokenReduction(
  originalOps: number,
  filteredOps: number,
  originalSchemas: number,
  filteredSchemas: number,
  originalPromptLength?: number,
  optimizedPromptLength?: number
): number {
  // Context reduction
  const opTokens = originalOps * 150;
  const schemaTokens = originalSchemas * 80;
  const contextOriginal = opTokens + schemaTokens;
  
  const filteredOpTokens = filteredOps * 150;
  const filteredSchemaTokens = filteredSchemas * 80;
  const contextFiltered = filteredOpTokens + filteredSchemaTokens;
  
  // Prompt reduction (approximate 4 chars per token)
  const promptOriginal = originalPromptLength ? Math.ceil(originalPromptLength / 4) : 0;
  const promptFiltered = optimizedPromptLength ? Math.ceil(optimizedPromptLength / 4) : 0;
  
  const totalOriginal = contextOriginal + promptOriginal;
  const totalFiltered = contextFiltered + promptFiltered;
  
  if (totalOriginal === 0) return 0;
  
  return Math.round(((totalOriginal - totalFiltered) / totalOriginal) * 100);
}

/**
 * Optimize context for Prisma workflow stage
 */
function optimizePrismaContext(
  context: IWorkflowContext,
  options: IStageOptimizationOptions,
  fullDocument?: AutoBeOpenApi.IDocument
): { operations: AutoBeOpenApi.IOperation[]; schemas: Record<string, any>; history: any[] } {
  const maxOperations = options.maxItems?.operations || 15;
  const minScore = options.thresholds?.operations || 0.2;
  
  let operations: AutoBeOpenApi.IOperation[] = [];
  let schemas: Record<string, any> = {};
  let history: any[] = [];
  
  if (fullDocument?.operations) {
    // For Prisma, focus on operations that define data models
    const modelOperations = fullDocument.operations.filter(op => 
      op.method.toUpperCase() === 'POST' || op.method.toUpperCase() === 'PUT' || op.method.toUpperCase() === 'PATCH'
    );
    
    if (context.requirements) {
      const relevantOps = SemanticSimilarity.scoreForWorkflow(
        context,
        modelOperations,
        { maxResults: maxOperations, minScore }
      );
      operations = relevantOps.map(score => score.item);
    } else {
      operations = modelOperations.slice(0, maxOperations);
    }
  }
  
  if (fullDocument?.components?.schemas) {
    // Include schemas related to data models
    const allSchemas = fullDocument.components.schemas;
    const relevantSchemas = Object.keys(allSchemas).filter(name => 
      // Focus on entity/model schemas
      !name.toLowerCase().includes('response') &&
      !name.toLowerCase().includes('error') &&
      !name.toLowerCase().includes('list')
    );
    
    relevantSchemas.forEach(name => {
      if (allSchemas[name]) {
        schemas[name] = allSchemas[name];
      }
    });
  }
  
  return { operations, schemas, history };
}

/**
 * Optimize context for Interface workflow stage
 */
function optimizeInterfaceContext(
  context: IWorkflowContext,
  options: IStageOptimizationOptions,
  fullDocument?: AutoBeOpenApi.IDocument,
  fullSdkFunctions?: Record<string, any>
): { operations: AutoBeOpenApi.IOperation[]; schemas: Record<string, any>; sdkFunctions: Record<string, any>; history: any[] } {
  const maxOperations = options.maxItems?.operations || 25;
  const maxSchemas = options.maxItems?.schemas || 50;
  const minScore = options.thresholds?.operations || 0.15;
  
  let operations: AutoBeOpenApi.IOperation[] = [];
  let schemas: Record<string, any> = {};
  let sdkFunctions: Record<string, any> = {};
  let history: any[] = [];
  
  if (fullDocument?.operations) {
    if (context.currentOperation || context.requirements) {
      const relevantOps = SemanticSimilarity.scoreForWorkflow(
        context,
        fullDocument.operations,
        { maxResults: maxOperations, minScore }
      );
      operations = relevantOps.map(score => score.item);
    } else {
      // If no specific context, use smart sampling
      operations = sampleOperationsByType(fullDocument.operations, maxOperations);
    }
  }
  
  if (fullDocument?.components?.schemas && operations.length > 0) {
    // Get schemas for selected operations
    const compatibleOperations = operations.map(op => ({
      requestBody: op.requestBody,
      responseBody: op.responseBody,
      path: op.path
    }));
    
    const schemaScores = SemanticSimilarity.scoreSchemas(
      compatibleOperations,
      fullDocument.components.schemas,
      { maxResults: maxSchemas, includeRelated: true }
    );
    
    schemaScores.forEach(score => {
      schemas[score.item.name] = score.item.schema;
    });
  }
  
  if (fullSdkFunctions && operations.length > 0) {
    sdkFunctions = filterSdkFunctions(operations, fullSdkFunctions);
  }
  
  return { operations, schemas, sdkFunctions, history };
}

/**
 * Optimize context for Test workflow stage
 */
function optimizeTestContext(
  context: IWorkflowContext,
  options: IStageOptimizationOptions,
  fullDocument?: AutoBeOpenApi.IDocument,
  fullSdkFunctions?: Record<string, any>,
  fullE2eExamples?: Record<string, any>
): { operations: AutoBeOpenApi.IOperation[]; schemas: Record<string, any>; sdkFunctions: Record<string, any>; e2eExamples: Record<string, any>; history: any[] } {
  const maxOperations = options.maxItems?.operations || 20;
  const maxSchemas = options.maxItems?.schemas || 40;
  const minScore = options.thresholds?.operations || 0.1;
  
  let operations: AutoBeOpenApi.IOperation[] = [];
  let schemas: Record<string, any> = {};
  let sdkFunctions: Record<string, any> = {};
  let e2eExamples: Record<string, any> = {};
  let history: any[] = [];
  
  if (fullDocument?.operations) {
    if (context.currentOperation) {
      // Use existing test optimization logic
      const scenario = context.currentOperation as AutoBeTestScenario;
      const operationsForScoring = fullDocument.operations.map(op => ({
        method: op.method,
        path: op.path,
        summary: op.summary || "",
        tags: (op as any).tags || []
      }));
      
      const operationScores = SemanticSimilarity.scoreOperations(
        scenario,
        operationsForScoring,
        { maxResults: maxOperations, minScore }
      );
      
      operations = operationScores.map(score => 
        fullDocument.operations.find(op => 
          op.method === score.item.method && op.path === score.item.path
        )!
      );
    } else {
      const relevantOps = SemanticSimilarity.scoreForWorkflow(
        context,
        fullDocument.operations,
        { maxResults: maxOperations, minScore }
      );
      operations = relevantOps.map(score => score.item);
    }
  }
  
  // Get schemas, SDK functions, and examples
  if (operations.length > 0) {
    if (fullDocument?.components?.schemas) {
      const compatibleOperations = operations.map(op => ({
        requestBody: op.requestBody,
        responseBody: op.responseBody,
        path: op.path
      }));
      
      const schemaScores = SemanticSimilarity.scoreSchemas(
        compatibleOperations,
        fullDocument.components.schemas,
        { maxResults: maxSchemas, includeRelated: true }
      );
      
      schemaScores.forEach(score => {
        schemas[score.item.name] = score.item.schema;
      });
    }
    
    if (fullSdkFunctions) {
      sdkFunctions = filterSdkFunctions(operations, fullSdkFunctions);
    }
    
    if (fullE2eExamples) {
      e2eExamples = filterE2eExamples(operations, fullE2eExamples, true);
    }
  }
  
  return { operations, schemas, sdkFunctions, e2eExamples, history };
}

/**
 * Optimize context for Realize workflow stage
 */
function optimizeRealizeContext(
  context: IWorkflowContext,
  options: IStageOptimizationOptions,
  fullDocument?: AutoBeOpenApi.IDocument,
  fullSdkFunctions?: Record<string, any>,
  fullE2eExamples?: Record<string, any>
): { operations: AutoBeOpenApi.IOperation[]; schemas: Record<string, any>; sdkFunctions: Record<string, any>; e2eExamples: Record<string, any>; history: any[] } {
  const maxOperations = options.maxItems?.operations || 30;
  const maxSchemas = options.maxItems?.schemas || 60;
  const minScore = options.thresholds?.operations || 0.2;
  
  let operations: AutoBeOpenApi.IOperation[] = [];
  let schemas: Record<string, any> = {};
  let sdkFunctions: Record<string, any> = {};
  let e2eExamples: Record<string, any> = {};
  let history: any[] = [];
  
  if (fullDocument?.operations) {
    if (context.currentOperation) {
      const relevantOps = SemanticSimilarity.scoreForWorkflow(
        context,
        fullDocument.operations,
        { maxResults: maxOperations, minScore }
      );
      operations = relevantOps.map(score => score.item);
    } else {
      // For implementation, prioritize complex operations
      operations = fullDocument.operations
        .sort((a, b) => calculateImplementationPriority(b) - calculateImplementationPriority(a))
        .slice(0, maxOperations);
    }
  }
  
  // Include comprehensive context for implementation
  if (operations.length > 0) {
    if (fullDocument?.components?.schemas) {
      const compatibleOperations = operations.map(op => ({
        requestBody: op.requestBody,
        responseBody: op.responseBody,
        path: op.path
      }));
      
      const schemaScores = SemanticSimilarity.scoreSchemas(
        compatibleOperations,
        fullDocument.components.schemas,
        { maxResults: maxSchemas, includeRelated: true }
      );
      
      schemaScores.forEach(score => {
        schemas[score.item.name] = score.item.schema;
      });
    }
    
    if (fullSdkFunctions) {
      sdkFunctions = filterSdkFunctions(operations, fullSdkFunctions);
    }
    
    if (fullE2eExamples) {
      e2eExamples = filterE2eExamples(operations, fullE2eExamples, false); // Less aggressive for implementation
    }
  }
  
  return { operations, schemas, sdkFunctions, e2eExamples, history };
}

/**
 * Smart sampling of operations by type
 */
function sampleOperationsByType(operations: AutoBeOpenApi.IOperation[], maxCount: number): AutoBeOpenApi.IOperation[] {
  const byMethod = new Map<string, AutoBeOpenApi.IOperation[]>();
  
  operations.forEach(op => {
    if (!byMethod.has(op.method)) {
      byMethod.set(op.method, []);
    }
    byMethod.get(op.method)!.push(op);
  });
  
  const result: AutoBeOpenApi.IOperation[] = [];
  const methodPriority = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];
  
  // Distribute quota across methods
  const perMethod = Math.floor(maxCount / byMethod.size);
  const remainder = maxCount % byMethod.size;
  
  let addedRemainder = 0;
  methodPriority.forEach(method => {
    const opsForMethod = byMethod.get(method) || [];
    const quota = perMethod + (addedRemainder < remainder ? 1 : 0);
    
    result.push(...opsForMethod.slice(0, quota));
    
    if (addedRemainder < remainder) addedRemainder++;
  });
  
  // Add any remaining methods not in priority list
  byMethod.forEach((ops, method) => {
    if (!methodPriority.includes(method) && result.length < maxCount) {
      const remaining = maxCount - result.length;
      result.push(...ops.slice(0, remaining));
    }
  });
  
  return result.slice(0, maxCount);
}

/**
 * Calculate implementation priority for operations
 */
function calculateImplementationPriority(operation: AutoBeOpenApi.IOperation): number {
  let priority = 0;
  
  // Method complexity
  const methodPriority: Record<string, number> = { 'POST': 5, 'PUT': 4, 'PATCH': 4, 'DELETE': 3, 'GET': 2 };
  priority += methodPriority[operation.method?.toUpperCase()] || 1;
  
  // Path complexity
  const pathSegments = operation.path.split('/').filter(Boolean);
  priority += Math.min(pathSegments.length, 3);
  
  // Request body complexity
  if (operation.requestBody) priority += 2;
  
  // Authorization complexity
  if ((operation as any).security) priority += 1;
  
  return priority;
}