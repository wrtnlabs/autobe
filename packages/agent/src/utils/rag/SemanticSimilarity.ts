/**
 * Semantic similarity utilities for RAG-based context retrieval across all AutoBE workflow stages.
 * 
 * This module provides functions to calculate semantic similarity for different workflow contexts:
 * - Prisma: Database schema and component relevance
 * - Interface: API operations and schema relevance  
 * - Test: Test scenario and operation relevance
 * - Realize: Implementation and operation relevance
 */

export interface ISemanticScore {
  /**
   * Similarity score between 0 and 1
   */
  score: number;
  
  /**
   * The item being scored
   */
  item: any;
  
  /**
   * Reason for the score (for debugging)
   */
  reason?: string;
}

/**
 * Workflow stage identifiers for stage-aware context optimization
 */
export type WorkflowStage = 'analyze' | 'prisma' | 'interface' | 'test' | 'realize';

/**
 * Context for different workflow stages
 */
export interface IWorkflowContext {
  stage: WorkflowStage;
  currentOperation?: any;
  requirements?: string;
  schemas?: Record<string, any>;
  operations?: any[];
  dependencies?: any[];
}

/**
 * Stage-aware semantic similarity calculation for AutoBE workflow optimization.
 */
export namespace SemanticSimilarity {
  /**
   * Score items based on relevance to current workflow context
   */
  export function scoreForWorkflow(
    context: IWorkflowContext,
    items: any[],
    options: {
      maxResults?: number;
      minScore?: number;
    } = {}
  ): ISemanticScore[] {
    switch (context.stage) {
      case 'prisma':
        return scorePrismaRelevance(context, items, options);
      case 'interface':
        return scoreInterfaceRelevance(context, items, options);
      case 'test':
        return scoreTestRelevance(context, items, options);
      case 'realize':
        return scoreRealizeRelevance(context, items, options);
      default:
        return scoreGenericRelevance(context, items, options);
    }
  }

  /**
   * Score operations based on relevance to a test scenario (backward compatibility)
   */
  export function scoreOperations(
    scenario: {
      draft: string;
      functionName: string;
      endpoint: { method: string; path: string };
      dependencies?: Array<{ endpoint: { method: string; path: string } }>;
    },
    operations: Array<{
      method: string;
      path: string;
      summary?: string;
      tags?: string[];
    }>,
    options: {
      maxResults?: number;
      minScore?: number;
    } = {}
  ): ISemanticScore[] {
    // Use test workflow context for backward compatibility
    const context: IWorkflowContext = {
      stage: 'test',
      currentOperation: scenario,
      operations
    };
    return scoreTestRelevance(context, operations, options);
  }

  /**
   * Score DTO schemas based on relevance to selected operations (backward compatibility)
   */
  export function scoreSchemas(
    selectedOperations: Array<{
      requestBody?: { typeName: string } | null;
      responseBody?: { typeName: string } | null;
      path: string;
    }>,
    allSchemas: Record<string, any>,
    options: {
      maxResults?: number;
      includeRelated?: boolean;
    } = {}
  ): ISemanticScore[] {
    const { maxResults = 50, includeRelated = true } = options;
    
    // Direct schema usage from operations
    const directSchemas = new Set<string>();
    selectedOperations.forEach(op => {
      if (op.requestBody?.typeName) directSchemas.add(op.requestBody.typeName);
      if (op.responseBody?.typeName) directSchemas.add(op.responseBody.typeName);
    });
    
    const scores: ISemanticScore[] = [];
    
    // Add direct schemas with high score
    directSchemas.forEach(schemaName => {
      if (allSchemas[schemaName]) {
        scores.push({
          score: 1.0,
          item: { name: schemaName, schema: allSchemas[schemaName] },
          reason: "directly used by selected operations"
        });
      }
    });
    
    if (includeRelated) {
      // Find related schemas through references
      const relatedSchemas = findRelatedSchemas(Array.from(directSchemas), allSchemas);
      relatedSchemas.forEach(({ name, depth }) => {
        if (!directSchemas.has(name) && allSchemas[name]) {
          scores.push({
            score: Math.max(0.1, 0.8 / depth),
            item: { name, schema: allSchemas[name] },
            reason: `related schema (depth: ${depth})`
          });
        }
      });
    }
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
}

/**
 * Score database components and schemas for Prisma workflow
 */
function scorePrismaRelevance(
  context: IWorkflowContext,
  items: any[],
  options: { maxResults?: number; minScore?: number } = {}
): ISemanticScore[] {
  const { maxResults = 20, minScore = 0.2 } = options;
  const requirements = context.requirements?.toLowerCase() || '';
  
  const scores = items.map(item => {
    let score = 0;
    const reasons: string[] = [];
    
    // Check for database keywords
    const dbKeywords = ['user', 'product', 'order', 'category', 'review', 'payment', 'address'];
    const itemText = JSON.stringify(item).toLowerCase();
    
    dbKeywords.forEach(keyword => {
      if (requirements.includes(keyword) && itemText.includes(keyword)) {
        score += 0.3;
        reasons.push(`db keyword match: ${keyword}`);
      }
    });
    
    // Entity relationship scoring
    if (item.relations || item.fields) {
      score += 0.2;
      reasons.push('entity with relations');
    }
    
    return {
      score: Math.min(score, 1.0),
      item,
      reason: reasons.join(", ") || "general relevance"
    };
  });
  
  return scores
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Score API operations and schemas for Interface workflow
 */
function scoreInterfaceRelevance(
  context: IWorkflowContext,
  items: any[],
  options: { maxResults?: number; minScore?: number } = {}
): ISemanticScore[] {
  const { maxResults = 20, minScore = 0.1 } = options;
  const requirements = context.requirements?.toLowerCase() || '';
  
  const scores = items.map(item => {
    let score = 0;
    const reasons: string[] = [];
    
    // API operation scoring
    if (item.method && item.path) {
      const pathSegments = item.path.split('/').filter(Boolean);
      
      // Check for business domain alignment
      const businessTerms = extractBusinessTerms(requirements);
      pathSegments.forEach((segment: string) => {
        if (businessTerms.some(term => segment.includes(term))) {
          score += 0.4;
          reasons.push(`business domain match: ${segment}`);
        }
      });
      
      // HTTP method relevance
      if (item.method?.toUpperCase() === 'GET' && requirements.includes('read')) score += 0.2;
      if (item.method?.toUpperCase() === 'POST' && requirements.includes('create')) score += 0.2;
      if (item.method?.toUpperCase() === 'PUT' && requirements.includes('update')) score += 0.2;
      if (item.method?.toUpperCase() === 'DELETE' && requirements.includes('delete')) score += 0.2;
    }
    
    return {
      score: Math.min(score, 1.0),
      item,
      reason: reasons.join(", ") || "general API relevance"
    };
  });
  
  return scores
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Score operations for Test workflow (enhanced version of original logic)
 */
function scoreTestRelevance(
  context: IWorkflowContext,
  items: any[],
  options: { maxResults?: number; minScore?: number } = {}
): ISemanticScore[] {
  const { maxResults = 20, minScore = 0.1 } = options;
  const scenario = context.currentOperation;
  
  if (!scenario) {
    return scoreGenericRelevance(context, items, options);
  }
  
  // Use existing test scoring logic
  const targetPath = scenario.endpoint?.path || '';
  const targetMethod = scenario.endpoint?.method || '';
  const scenarioText = `${scenario.draft || ''} ${scenario.functionName || ''}`.toLowerCase();
  const dependencyPaths = new Set(
    scenario.dependencies?.map((d: any) => d.endpoint?.path) ?? []
  );
  
  const scores = items.map(op => {
    let score = 0;
    const reasons: string[] = [];
    
    // Exact match for target endpoint
    if (op.method === targetMethod && op.path === targetPath) {
      score += 1.0;
      reasons.push("exact endpoint match");
    }
    
    // Dependency match
    if (dependencyPaths.has(op.path)) {
      score += 0.8;
      reasons.push("dependency match");
    }
    
    // Path similarity (shared segments)
    const pathSimilarity = calculatePathSimilarity(targetPath, op.path);
    if (pathSimilarity > 0.3) {
      score += pathSimilarity * 0.6;
      reasons.push(`path similarity: ${pathSimilarity.toFixed(2)}`);
    }
    
    // Business domain keywords
    const domainScore = calculateDomainSimilarity(scenarioText, op);
    if (domainScore > 0) {
      score += domainScore * 0.4;
      reasons.push(`domain similarity: ${domainScore.toFixed(2)}`);
    }
    
    // Method family bonus (CRUD operations)
    if (isSameMethodFamily(targetMethod, op.method)) {
      score += 0.2;
      reasons.push("same method family");
    }
    
    return {
      score: Math.min(score, 1.0),
      item: op,
      reason: reasons.join(", ")
    };
  });
  
  return scores
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Score operations and schemas for Realize workflow
 */
function scoreRealizeRelevance(
  _context: IWorkflowContext,
  items: any[],
  options: { maxResults?: number; minScore?: number } = {}
): ISemanticScore[] {
  const { maxResults = 20, minScore = 0.2 } = options;
  
  const scores = items.map(item => {
    let score = 0;
    const reasons: string[] = [];
    
    // Implementation complexity scoring
    if (item.method && item.path) {
      // Higher score for complex operations that need implementation
      const complexity = calculateImplementationComplexity(item);
      score += complexity * 0.5;
      reasons.push(`implementation complexity: ${complexity.toFixed(2)}`);
      
      // Authorization requirements
      if (item.security || item.authorization) {
        score += 0.3;
        reasons.push("requires authorization");
      }
    }
    
    // Function/controller relevance
    if (item.operationId || item.functionName) {
      score += 0.2;
      reasons.push("has implementation name");
    }
    
    return {
      score: Math.min(score, 1.0),
      item,
      reason: reasons.join(", ") || "implementation relevance"
    };
  });
  
  return scores
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Generic scoring for unknown stages
 */
function scoreGenericRelevance(
  _context: IWorkflowContext,
  items: any[],
  options: { maxResults?: number; minScore?: number } = {}
): ISemanticScore[] {
  const { maxResults = 20 } = options;
  
  // Simple relevance scoring based on string similarity
  const scores = items.map((item) => ({
    score: 0.5, // Default moderate relevance
    item,
    reason: "generic relevance"
  }));
  
  return scores.slice(0, maxResults);
}

/**
 * Extract business terms from requirements text
 */
function extractBusinessTerms(text: string): string[] {
  const businessKeywords = [
    'user', 'customer', 'product', 'order', 'payment', 'cart', 'sale',
    'review', 'category', 'inventory', 'shipping', 'address', 'auth',
    'login', 'register', 'search', 'filter', 'list', 'account', 'profile'
  ];
  
  return businessKeywords.filter(keyword => text.includes(keyword));
}

/**
 * Calculate implementation complexity for realize workflow
 */
function calculateImplementationComplexity(operation: any): number {
  let complexity = 0;
  
  // Method complexity
  const methodComplexity: Record<string, number> = {
    'GET': 0.2,
    'POST': 0.6,
    'PUT': 0.7,
    'PATCH': 0.8,
    'DELETE': 0.5
  };
  complexity += methodComplexity[operation.method?.toUpperCase()] || 0.3;
  
  // Path complexity (more segments = more complex)
  const pathSegments = operation.path?.split('/').filter(Boolean) || [];
  complexity += Math.min(pathSegments.length * 0.1, 0.3);
  
  // Request body complexity
  if (operation.requestBody) {
    complexity += 0.2;
  }
  
  return Math.min(complexity, 1.0);
}

/**
 * Calculate similarity between two API paths
 */
function calculatePathSimilarity(path1: string, path2: string): number {
  const segments1 = path1.split('/').filter(s => s);
  const segments2 = path2.split('/').filter(s => s);
  
  if (segments1.length === 0 || segments2.length === 0) return 0;
  
  let commonSegments = 0;
  const maxSegments = Math.max(segments1.length, segments2.length);
  
  for (let i = 0; i < Math.min(segments1.length, segments2.length); i++) {
    const seg1 = segments1[i];
    const seg2 = segments2[i];
    
    if (seg1 === seg2) {
      commonSegments += 1;
    } else if (seg1.startsWith(':') || seg2.startsWith(':') || 
               seg1.startsWith('{') || seg2.startsWith('{')) {
      // Path parameters are considered similar
      commonSegments += 0.5;
    }
  }
  
  return commonSegments / maxSegments;
}

/**
 * Calculate domain similarity based on keywords
 */
function calculateDomainSimilarity(
  scenarioText: string,
  operation: { summary?: string; tags?: string[]; path: string }
): number {
  const opText = `${operation.summary || ''} ${operation.tags?.join(' ') || ''} ${operation.path}`.toLowerCase();
  
  // Business domain keywords
  const businessKeywords = [
    'user', 'customer', 'product', 'order', 'payment', 'cart', 'sale',
    'review', 'category', 'inventory', 'shipping', 'address', 'auth',
    'login', 'register', 'search', 'filter', 'list', 'create', 'update',
    'delete', 'get', 'post', 'put', 'patch'
  ];
  
  let score = 0;
  let matches = 0;
  
  businessKeywords.forEach(keyword => {
    if (scenarioText.includes(keyword) && opText.includes(keyword)) {
      score += 1;
      matches++;
    }
  });
  
  return matches > 0 ? score / businessKeywords.length : 0;
}

/**
 * Check if two HTTP methods are in the same family
 */
function isSameMethodFamily(method1: string, method2: string): boolean {
  const readMethods = ['GET', 'HEAD', 'OPTIONS'];
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  return (
    (readMethods.includes(method1) && readMethods.includes(method2)) ||
    (writeMethods.includes(method1) && writeMethods.includes(method2))
  );
}

/**
 * Find schemas related to the given schemas through references
 */
function findRelatedSchemas(
  directSchemas: string[],
  allSchemas: Record<string, any>,
  maxDepth: number = 3
): Array<{ name: string; depth: number }> {
  const visited = new Set<string>(directSchemas);
  const result: Array<{ name: string; depth: number }> = [];
  const queue: Array<{ name: string; depth: number }> = [];
  
  // Initialize with direct schemas
  directSchemas.forEach(name => {
    if (allSchemas[name]) {
      queue.push({ name, depth: 0 });
    }
  });
  
  while (queue.length > 0) {
    const { name, depth } = queue.shift()!;
    
    if (depth >= maxDepth) continue;
    
    const schema = allSchemas[name];
    if (!schema) continue;
    
    // Find referenced schemas
    const refs = findSchemaReferences(schema);
    refs.forEach(refName => {
      if (!visited.has(refName) && allSchemas[refName]) {
        visited.add(refName);
        result.push({ name: refName, depth: depth + 1 });
        queue.push({ name: refName, depth: depth + 1 });
      }
    });
  }
  
  return result;
}

/**
 * Extract schema references from a schema object
 */
function findSchemaReferences(schema: any): string[] {
  const refs: string[] = [];
  
  function traverse(obj: any) {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (obj.$ref && typeof obj.$ref === 'string') {
      const match = obj.$ref.match(/#\/components\/schemas\/(.+)$/);
      if (match) {
        refs.push(match[1]);
      }
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else {
      Object.values(obj).forEach(traverse);
    }
  }
  
  traverse(schema);
  return [...new Set(refs)];
}