/**
 * @author juntak
 */
import { AutoBeAnalyzeFile } from "@autobe/interface";

import { EmbeddingProvider } from "./EmbeddingProvider";
import { createHash } from "node:crypto";

export interface RequirementSection {
  filename: `${string}.md`;
  heading: string;
  content: string;
  index: number;
  level: 2 | 3;
}

export interface RetrievalHit {
  section: RequirementSection;
  score: number;
  reason: string;
}

export interface VectorIndexItem {
  id: string;
  section: RequirementSection;
  vector: number[];

  tf: Map<string, number>;
  docLen: number;
}

export interface Bm25Stats {
  N: number;
  avgdl: number;
  df: Map<string, number>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Parse
function parseByLevel(file: Pick<AutoBeAnalyzeFile, 'filename' | 'content'>, level: 2 | 3): RequirementSection[] {
  const lines = file.content.split("\n");
  const re = level === 3 ? /^###\s+/ : /^##\s+/;
  const sections: RequirementSection[] = [];
  let inCode = false;
  let cur: RequirementSection | null = null;
  let idx = 0;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      if (cur) cur.content += line + "\n";
      continue;
    }
    if (!inCode && re.test(line)) {
      if (cur && cur.content.trim()) sections.push(cur);
      cur = {
        filename: file.filename,
        heading: line.trim(),
        content: "",
        index: idx++,
        level,
      };
      continue;
    }
    if (cur) cur.content += line + "\n";
  }
  if (cur && cur.content.trim()) sections.push(cur);
  return sections;
}

function parseByH3(
  section: RequirementSection,
  maxLength: number = 1000
): RequirementSection[] {
  if (section.content.length <= maxLength) return [section];

  const fileLike: Pick<AutoBeAnalyzeFile, 'filename' | 'content'> = {
    filename: section.filename,
    content: section.content,
  };

  const children = parseByLevel(fileLike, 3);

  if (children.length > 0) {
    return children.flatMap((c, i) =>
      parseByH3(
        {
          ...c,
          heading: `${section.heading} > ${c.heading}`,
          index: section.index * 1000 + i,
          level: 3,
        },
        maxLength
      )
    );
  }

  const forcedChunks: RequirementSection[] = [];
  const text = section.content;

  const totalParts = Math.ceil(text.length / maxLength);
  for (let i = 0; i < text.length; i += maxLength) {
    const chunkContent = text.slice(i, i + maxLength);
    const partNum = Math.floor(i / maxLength) + 1;

    forcedChunks.push({
      ...section,
      heading: `${section.heading} (${partNum}/${totalParts})`,
      content: chunkContent,
      index: section.index * 1000 + partNum,
      level: 3,
    });
  }

  return forcedChunks;
}


// BM25
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[`"'.,:;!?()[\]{}<>]/g, " ") 
    .split(/\s+/) 
    .filter((t) => t.length >= 2); 
}

function buildTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function buildDf(indexDocs: { tokens: string[] }[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const d of indexDocs) {
    const uniq = new Set(d.tokens);
    for (const term of uniq) df.set(term, (df.get(term) ?? 0) + 1);
  } 
  return df;
}

function bm25Score(
  queryTokens: string[],
  docTf: Map<string, number>,
  docLen: number,
  stats: Bm25Stats,
  k1: number = 1.5,
  b: number = 0.75
): number {
  let score = 0;
  const uq = new Set(queryTokens);
  for (const term of uq) {
    const df = stats.df.get(term) ?? 0;
    if (df === 0) continue;
    const idf = Math.log(1 + (stats.N - df + 0.5) / (df + 0.5));
    const tf = docTf.get(term) ?? 0;
    if (tf === 0) continue;
    const denom = tf + k1 * (1 - b + b * (docLen / stats.avgdl));
    score += idf * ((tf * (k1 + 1)) / denom); 
  }
  return score;
}

function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => (max === 0 ? 0 : 1));
  return values.map((v) => (v - min) / (max - min));
}

export async function buildVectorIndexHybrid(
  embedder: EmbeddingProvider,
  sections: RequirementSection[]
): Promise<{ index: VectorIndexItem[]; bm25: Bm25Stats }> {
  const docs = sections.map((s) => {
    const text = `${s.heading}\n${s.content}`;
    const tokens = tokenize(text);
    const tf = buildTf(tokens);
    return {
      id: `${s.filename}:${s.index}`,
      text, 
      section: s,
      tokens, 
      tf,
      docLen: tokens.length,
    };
  });

  const vectors = await embedder.embed(docs.map((d) => d.text));

  const N = docs.length;
  const totalLen = docs.reduce((acc, d) => acc + d.docLen, 0);
  const avgdl = N > 0 ? totalLen / N : 0;
  const df = buildDf(docs);
  const bm25: Bm25Stats = { N, avgdl, df };

  const index: VectorIndexItem[] = docs.map((d, i) => ({
    id: d.id,
    section: d.section,
    vector: vectors[i]!,
    tf: d.tf,
    docLen: d.docLen,
  }));
  return { index, bm25 };
}

export function preprocessFiles(
  files: Pick<AutoBeAnalyzeFile, 'filename' | 'content'>[],
  h3MaxLength: number = 1000
): RequirementSection[] {
  const h2Sections = files.flatMap((f) => parseByLevel(f, 2));
  return h2Sections.flatMap((s) => parseByH3(s, h3MaxLength));
}


function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const pos = (p / 100) * (sortedAsc.length - 1);
  const base = Math.floor(pos);
  const rest = pos - base;
  const a = sortedAsc[base]!;
  const b = sortedAsc[Math.min(base + 1, sortedAsc.length - 1)]!;
  return a + (b - a) * rest;
}

// Debug info for Dynamic K analysis
export interface DynamicKDebugInfo {
  kMin: number;
  kMax: number;
  computedK: number;
  p90: number;
  p50: number;
  gap: number;
  sharpness: number;
  totalHits: number;
}

// Hybrid Retrieval
export async function retrieveTopKAdaptiveHybrid(
  embedder: EmbeddingProvider,
  queryText: string,
  index: VectorIndexItem[],
  bm25: Bm25Stats,
  kMin: number = 3,
  kMax?: number,
  wVec: number = 0.6,
  wBm25: number = 0.4,
  debug: boolean = false
): Promise<RetrievalHit[]> {
  const N = index.length;
  const effectiveKMax =
    kMax ?? Math.min(12, Math.max(8, Math.ceil(0.05 * N)));

  const qVecs = await embedder.embed([queryText]);
  const qVec = qVecs[0];
  if (!qVec) return [];

  const qTokens = tokenize(queryText);

  const vecScores = index.map((item) => cosineSimilarity(qVec, item.vector));
  const bmScores = index.map((item) =>
    bm25Score(qTokens, item.tf, item.docLen, bm25)
  );

  const vecNorm = minMaxNormalize(vecScores);
  const bmNorm = minMaxNormalize(bmScores);

  const hits: RetrievalHit[] = index.map((item, i) => {
    const score = wVec * vecNorm[i]! + wBm25 * bmNorm[i]!;
    return {
      section: item.section,
      score,
      reason: `hybrid=${score.toFixed(4)} (vec=${vecNorm[i]!.toFixed(3)}, bm25=${bmNorm[
        i
      ]!.toFixed(3)})`,
    };
  });

  // Compute Dynamic K with debug info
  const scores = hits.map((h) => h.score);
  const sorted = [...scores].sort((a, b) => a - b);
  const p90 = percentile(sorted, 90);
  const p50 = percentile(sorted, 50);
  const gap = p90 - p50;
  const GAP_MIN = 0.02;
  const GAP_MAX = 0.50;
  const sharpness = clamp((gap - GAP_MIN) / (GAP_MAX - GAP_MIN), 0, 1);
  const K = Math.round(kMin + (1 - sharpness) * (effectiveKMax - kMin));

  if (debug) {
    console.log(`[DYNAMIC-K-DEBUG]`);
    console.log(`  kMin=${kMin}, kMax=${effectiveKMax}, computedK=${K}`);
    console.log(`  p90=${p90.toFixed(4)}, p50=${p50.toFixed(4)}, gap=${gap.toFixed(4)}`);
    console.log(`  sharpness=${sharpness.toFixed(4)} (0=flat, 1=sharp)`);
    console.log(`  totalHits=${hits.length}`);
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, K);
}

// Extended version that returns all hits for OOD detection
export interface RetrievalResultEx {
  topK: RetrievalHit[];       // Sliced top-K results
  all: RetrievalHit[];        // All hits sorted by score (before slice)
  K: number;                  // Computed K value
  stats: {
    p90: number;
    p50: number;
    gap: number;
    sharpness: number;
    vecRawMax: number;        // Raw cosine similarity max (before normalization)
    bm25RawMax: number;       // Raw BM25 score max (before normalization)
  };
}

export async function retrieveTopKAdaptiveHybridEx(
  embedder: EmbeddingProvider,
  queryText: string,
  index: VectorIndexItem[],
  bm25: Bm25Stats,
  kMin: number = 3,
  kMax?: number,
  wVec: number = 0.6,
  wBm25: number = 0.4,
): Promise<RetrievalResultEx> {
  const N = index.length;
  const effectiveKMax =
    kMax ?? Math.min(12, Math.max(8, Math.ceil(0.05 * N)));

  const qVecs = await embedder.embed([queryText]);
  const qVec = qVecs[0];
  if (!qVec) {
    return {
      topK: [],
      all: [],
      K: 0,
      stats: { p90: 0, p50: 0, gap: 0, sharpness: 0, vecRawMax: 0, bm25RawMax: 0 },
    };
  }

  const qTokens = tokenize(queryText);

  const vecScores = index.map((item) => cosineSimilarity(qVec, item.vector));
  const bmScores = index.map((item) =>
    bm25Score(qTokens, item.tf, item.docLen, bm25)
  );

  // Raw max values for OOD detection
  const vecRawMax = Math.max(...vecScores);
  const bm25RawMax = Math.max(...bmScores);

  const vecNorm = minMaxNormalize(vecScores);
  const bmNorm = minMaxNormalize(bmScores);

  const hits: RetrievalHit[] = index.map((item, i) => {
    const score = wVec * vecNorm[i]! + wBm25 * bmNorm[i]!;
    return {
      section: item.section,
      score,
      reason: `hybrid=${score.toFixed(4)} (vec=${vecNorm[i]!.toFixed(3)}, bm25=${bmNorm[i]!.toFixed(3)})`,
    };
  });

  // Compute Dynamic K
  const scores = hits.map((h) => h.score);
  const sorted = [...scores].sort((a, b) => a - b);
  const p90 = percentile(sorted, 90);
  const p50 = percentile(sorted, 50);
  const gap = p90 - p50;
  const GAP_MIN = 0.02;
  const GAP_MAX = 0.50;
  const sharpness = clamp((gap - GAP_MIN) / (GAP_MAX - GAP_MIN), 0, 1);
  const K = Math.round(kMin + (1 - sharpness) * (effectiveKMax - kMin));

  const allSorted = hits.sort((a, b) => b.score - a.score);

  return {
    topK: allSorted.slice(0, K),
    all: allSorted,
    K,
    stats: { p90, p50, gap, sharpness, vecRawMax, bm25RawMax },
  };
}

// Caching
interface CachedRetrievalIndex {
  filesHash: string;
  index: VectorIndexItem[];
  bm25: Bm25Stats;
}

type BuildResult = { index: VectorIndexItem[]; bm25: Bm25Stats };

const _indexCache = new Map<string, CachedRetrievalIndex>();
const _buildingPromises = new Map<string, Promise<BuildResult>>();

function computeFilesHash(files: Pick<AutoBeAnalyzeFile, 'filename' | 'content'>[]): string {
  const combinedPayload = files
    .map((f) => `file:${f.filename}\ncontent:${f.content}`)
    .sort()
    .join("\n---\n");

  return createHash("sha256").update(combinedPayload).digest("hex");
}

export async function getOrBuildIndex(
  embedder: EmbeddingProvider,
  files: Pick<AutoBeAnalyzeFile, 'filename' | 'content'>[],
  h3MaxLength: number = 1000
): Promise<BuildResult> {
  const hash = computeFilesHash(files);

  const cached = _indexCache.get(hash);
  if (cached) {
    return { index: cached.index, bm25: cached.bm25 };
  }

  const existingPromise = _buildingPromises.get(hash);
  if (existingPromise) {
    return existingPromise;
  }

  const buildPromise = (async (): Promise<BuildResult> => {
    const sections = preprocessFiles(files, h3MaxLength);
    if (sections.length === 0) {
      return { index: [], bm25: { N: 0, avgdl: 0, df: new Map<string, number>() } };
    }

    const { index, bm25 } = await buildVectorIndexHybrid(embedder, sections);
    _indexCache.set(hash, { filesHash: hash, index, bm25 });
    return { index, bm25 };
  })();

  _buildingPromises.set(hash, buildPromise);

  try {
    return await buildPromise;
  } finally {
    _buildingPromises.delete(hash);
  }
}

export interface RagAnalysisFile extends AutoBeAnalyzeFile {
  reason: string;
}

export function hitsToAnalysisFiles(hits: RetrievalHit[]): RagAnalysisFile[] {
  if (hits.length === 0) return [];

  const grouped = new Map<string, RetrievalHit[]>();
  for (const hit of hits) {
    const filename = hit.section.filename;
    const arr = grouped.get(filename) ?? [];
    arr.push(hit);
    grouped.set(filename, arr);
  }

  const result: RagAnalysisFile[] = [];
  for (const [filename, fileHits] of grouped) {
    fileHits.sort((a, b) => a.section.index - b.section.index);

    const content = fileHits
      .map((h) => `${h.section.heading}\n${h.section.content.trim()}`)
      .join("\n\n");

    const avgScore = fileHits.reduce((sum, h) => sum + h.score, 0) / fileHits.length;

    result.push({
      filename: filename as `${string}.md`,
      content,
      reason: `Retrieved ${fileHits.length} relevant sections (avg score: ${avgScore.toFixed(3)})`,
    });
  }

  return result;
}

export interface RetrieveAnalysisFilesOptions {
  kMin?: number;
  kMax?: number;
  h3MaxLength?: number;
  splitCount?: number;
  log?: boolean;
  logPrefix?: string;
}

export async function retrieveRelevantAnalysisFiles(
  embedder: EmbeddingProvider,
  files: Pick<AutoBeAnalyzeFile, 'filename' | 'content'>[],
  query: string,
  options?: RetrieveAnalysisFilesOptions
): Promise<RagAnalysisFile[]> {
  const log = options?.log ?? false;
  const prefix = options?.logPrefix ? `[${options.logPrefix}]` : "";

  // [RAG][ENTER]
  const inputTotalChars = files.reduce(
    (sum, f) => sum + (f.content?.length ?? 0),
    0,
  );
  if (log) {
    console.log(
      `[RAG]${prefix}[ENTER] queryLen=${query.length} files=${files.length} inputChars=${inputTotalChars}`,
    );
  }

  if (files.length === 0 || !query.trim()) {
    if (log) {
      console.log(`[RAG]${prefix}[RESULT] hits=0 totalChars=0 (early return)`);
    }
    return [];
  }

  try {
    const { index, bm25 } = await getOrBuildIndex(
      embedder,
      files,
      options?.h3MaxLength ?? 1000
    );

    if (index.length === 0) {
      if (log) {
        console.log(`[RAG]${prefix}[RESULT] hits=0 totalChars=0 (empty index)`);
      }
      return [];
    }

    const split = options?.splitCount ?? 1;
    const kMin = options?.kMin ? Math.ceil(options.kMin / split) : undefined;
    const kMax = options?.kMax ? Math.ceil(options.kMax / split) : undefined;

    const hits = await retrieveTopKAdaptiveHybrid(
      embedder,
      query,
      index,
      bm25,
      kMin,
      kMax
    );

    const results = hitsToAnalysisFiles(hits);

    // [RAG][RESULT]
    if (log) {
      const resultTotalChars = results.reduce(
        (sum, f) => sum + (f.content?.length ?? 0),
        0,
      );
      const reduction = inputTotalChars > 0
        ? ((1 - resultTotalChars / inputTotalChars) * 100).toFixed(1)
        : "0";
      console.log(
        `[RAG]${prefix}[RESULT] hits=${results.length} totalChars=${resultTotalChars} reduction=${reduction}%`,
      );
    }

    return results;
  } catch (error) {
    if (log) {
      console.error(`[RAG]${prefix}[ERROR] retrieveRelevantAnalysisFiles failed:`, error);
      console.log(`[RAG]${prefix}[RESULT] hits=0 totalChars=0 (error)`);
    }
    return [];
  }
}

export function clearIndexCache(): void {
  _indexCache.clear();
  _buildingPromises.clear();
}

// ============================================================================
// Analysis Context Mode - Unified RAG control
// ============================================================================

/**
 * Analysis context mode for RAG control.
 * - "TOPK": Use RAG retrieval (calls retrieveRelevantAnalysisFiles)
 * - "FULL": Use all analysis files without filtering (no RAG call)
 * - "NONE": Use no analysis files (no RAG call)
 */
export type AnalysisContextMode = "TOPK" | "FULL" | "NONE";

export interface BuildAnalysisContextOptions {
  kMin?: number;
  kMax?: number;
  h3MaxLength?: number;
  splitCount?: number;
  log?: boolean;
  logPrefix?: string;
}

/**
 * Build analysis context files based on the specified mode.
 *
 * This is the central function for RAG policy enforcement.
 * - NONE: Returns [] without calling retrieveRelevantAnalysisFiles
 * - FULL: Returns all files without calling retrieveRelevantAnalysisFiles
 * - TOPK: Calls retrieveRelevantAnalysisFiles for filtered results
 *
 * The function uses generics to preserve the input file type for FULL mode,
 * while TOPK mode returns RagAnalysisFile[].
 *
 * @param embedder - Embedding provider for vector search (only used in TOPK mode)
 * @param files - Source analysis files (any type with filename and content)
 * @param query - Query text for retrieval (only used in TOPK mode)
 * @param mode - Analysis context mode
 * @param options - Optional parameters
 * @returns Filtered or full analysis files based on mode
 */
export async function buildAnalysisContextFiles<
  T extends Pick<AutoBeAnalyzeFile, 'filename' | 'content'>
>(
  embedder: EmbeddingProvider,
  files: T[],
  query: string,
  mode: AnalysisContextMode,
  options?: BuildAnalysisContextOptions
): Promise<T[]> {
  const log = options?.log ?? false;
  const prefix = options?.logPrefix ? `[${options.logPrefix}]` : "";

  const inputTotalChars = files.reduce(
    (sum, f) => sum + (f.content?.length ?? 0),
    0
  );

  if (mode === "NONE") {
    if (log) {
      console.log(
        `[RAG-CONTEXT]${prefix} mode=NONE files=0 chars=0 (skipped)`
      );
    }
    return [];
  }

  if (mode === "FULL") {
    if (log) {
      console.log(
        `[RAG-CONTEXT]${prefix} mode=FULL files=${files.length} chars=${inputTotalChars} (pass-through)`
      );
    }
    return files;
  }

  // mode === "TOPK"
  const result = await retrieveRelevantAnalysisFiles(embedder, files, query, {
    kMin: options?.kMin,
    kMax: options?.kMax,
    h3MaxLength: options?.h3MaxLength,
    splitCount: options?.splitCount,
    log,
    logPrefix: options?.logPrefix,
  });

  if (log) {
    const resultTotalChars = result.reduce(
      (sum, f) => sum + (f.content?.length ?? 0),
      0
    );
    const reduction = inputTotalChars > 0
      ? ((1 - resultTotalChars / inputTotalChars) * 100).toFixed(1)
      : "0";
    console.log(
      `[RAG-CONTEXT]${prefix} mode=TOPK files=${result.length} chars=${resultTotalChars} reduction=${reduction}%`
    );
  }

  // RagAnalysisFile extends the input type with 'reason' field
  // Cast is safe because RagAnalysisFile is a superset of IAnalyzeFileInput
  return result as unknown as T[];
}