/**
 * Semantic similarity utilities for RAG-based context retrieval.
 * 
 * This module provides functions to calculate semantic similarity between
 * test scenarios and API operations/schemas to reduce token consumption
 * by including only relevant context in LLM requests.
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
 * Calculate semantic similarity between a test scenario and API operations.
 * Uses keyword matching, path similarity, and business domain matching.
 */
export namespace SemanticSimilarity {
  /**
   * Score operations based on relevance to a test scenario
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
    const { maxResults = 20, minScore = 0.1 } = options;
    
    const targetPath = scenario.endpoint.path;
    const targetMethod = scenario.endpoint.method;
    const scenarioText = `${scenario.draft} ${scenario.functionName}`.toLowerCase();
    const dependencyPaths = new Set(
      scenario.dependencies?.map(d => d.endpoint.path) ?? []
    );
    
    const scores = operations.map(op => {
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
   * Score DTO schemas based on relevance to selected operations
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