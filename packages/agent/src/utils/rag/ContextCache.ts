/**
 * Context caching system for RAG optimization.
 * 
 * Caches frequently used semantic contexts to avoid repeated computation
 * and further reduce token consumption through context reuse.
 */

export interface ICacheEntry {
  key: string;
  context: any;
  timestamp: number;
  hitCount: number;
  scenarios: string[]; // Track which scenarios used this context
}

export interface ICacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
  memoryUsage: number;
}

/**
 * LRU Cache for optimized contexts with semantic grouping
 */
export class ContextCache {
  private cache = new Map<string, ICacheEntry>();
  private maxSize: number;
  private maxAge: number; // in milliseconds
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor(options: {
    maxSize?: number;
    maxAge?: number; // in minutes
  } = {}) {
    this.maxSize = options.maxSize || 100;
    this.maxAge = (options.maxAge || 60) * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Generate cache key from scenario characteristics
   */
  private generateKey(scenario: {
    endpoint: { method: string; path: string };
    dependencies?: Array<{ endpoint: { method: string; path: string } }>;
  }): string {
    const endpoint = `${scenario.endpoint.method}:${scenario.endpoint.path}`;
    const deps = scenario.dependencies?.map(d => `${d.endpoint.method}:${d.endpoint.path}`).sort().join(',') || '';
    return `${endpoint}|${deps}`;
  }

  /**
   * Get cached context for a scenario
   */
  get(scenario: {
    endpoint: { method: string; path: string };
    dependencies?: Array<{ endpoint: { method: string; path: string } }>;
    functionName?: string;
  }): any | null {
    const key = this.generateKey(scenario);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update LRU and hit count
    entry.hitCount++;
    entry.timestamp = Date.now();
    if (scenario.functionName) {
      entry.scenarios.push(scenario.functionName);
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.stats.hits++;
    return entry.context;
  }

  /**
   * Cache a context for future use
   */
  set(scenario: {
    endpoint: { method: string; path: string };
    dependencies?: Array<{ endpoint: { method: string; path: string } }>;
    functionName?: string;
  }, context: any): void {
    const key = this.generateKey(scenario);
    
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    const entry: ICacheEntry = {
      key,
      context,
      timestamp: Date.now(),
      hitCount: 0,
      scenarios: scenario.functionName ? [scenario.functionName] : []
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Find similar cached contexts using semantic similarity
   */
  findSimilar(scenario: {
    endpoint: { method: string; path: string };
    dependencies?: Array<{ endpoint: { method: string; path: string } }>;
  }, threshold: number = 0.7): ICacheEntry[] {
    const results: Array<{ entry: ICacheEntry; similarity: number }> = [];
    
    for (const entry of this.cache.values()) {
      const similarity = this.calculateSimilarity(scenario, entry);
      if (similarity >= threshold) {
        results.push({ entry, similarity });
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .map(r => r.entry);
  }

  /**
   * Calculate similarity between two scenarios
   */
  private calculateSimilarity(
    scenario1: { endpoint: { method: string; path: string }; dependencies?: any[] },
    entry: ICacheEntry
  ): number {
    // Extract endpoint from cached key
    const keyParts = entry.key.split('|');
    const [method, path] = keyParts[0].split(':');
    
    // Path similarity
    const pathSim = this.pathSimilarity(scenario1.endpoint.path, path);
    
    // Method similarity
    const methodSim = scenario1.endpoint.method === method ? 1.0 : 0.0;
    
    // Dependencies similarity (simplified)
    const depCount1 = scenario1.dependencies?.length || 0;
    const depCount2 = keyParts[1] ? keyParts[1].split(',').length : 0;
    const depSim = depCount1 === depCount2 ? 1.0 : Math.max(0, 1 - Math.abs(depCount1 - depCount2) * 0.2);
    
    return pathSim * 0.5 + methodSim * 0.3 + depSim * 0.2;
  }

  /**
   * Calculate path similarity
   */
  private pathSimilarity(path1: string, path2: string): number {
    const segments1 = path1.split('/').filter(s => s);
    const segments2 = path2.split('/').filter(s => s);
    
    if (segments1.length === 0 && segments2.length === 0) return 1.0;
    if (segments1.length === 0 || segments2.length === 0) return 0.0;
    
    let commonSegments = 0;
    const maxLength = Math.max(segments1.length, segments2.length);
    
    for (let i = 0; i < Math.min(segments1.length, segments2.length); i++) {
      const seg1 = segments1[i];
      const seg2 = segments2[i];
      
      if (seg1 === seg2) {
        commonSegments += 1;
      } else if ((seg1.startsWith('{') && seg1.endsWith('}')) || 
                 (seg2.startsWith('{') && seg2.endsWith('}'))) {
        commonSegments += 0.8; // Parameters are similar
      }
    }
    
    return commonSegments / maxLength;
  }

  /**
   * Get cache statistics
   */
  getStats(): ICacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const memoryUsage = this.cache.size * 1024; // Rough estimate
    
    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRatio: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      memoryUsage
    };
  }

  /**
   * Clear cache and reset statistics
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get top cached scenarios by hit count
   */
  getTopScenarios(limit: number = 10): Array<{ key: string; hits: number; scenarios: string[] }> {
    return Array.from(this.cache.values())
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, limit)
      .map(entry => ({
        key: entry.key,
        hits: entry.hitCount,
        scenarios: [...new Set(entry.scenarios)] // Remove duplicates
      }));
  }
}

/**
 * Global context cache instance
 */
export const globalContextCache = new ContextCache({
  maxSize: 200,
  maxAge: 120 // 2 hours
});