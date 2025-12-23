import { EmbeddingProvider } from "./EmbeddingProvider";

export interface RequirementSection {
  filename: string;
  heading: string;
  content: string;
  index: number;
  level: 2 | 3;
}

export interface AutoBeAnalyzeFile {
  filename: string;
  content: string;
}

export interface RetrievalHit {
  section: RequirementSection;
  score: number;
  reason: string;
}

export interface VectorIndexItem {
  id: string;
  text: string;
  section: RequirementSection;
  vector: number[];

  tokens: string[];
  tf: Map<string, number>;
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
function parseByLevel(file: AutoBeAnalyzeFile, level: 2 | 3): RequirementSection[] {
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

function parseByH3(section: RequirementSection, maxLength: number = 1000): RequirementSection[] {
  if (section.content.length < maxLength) return [section];
  const fileLike: AutoBeAnalyzeFile = {
    filename: section.filename,
    content: section.content,
  };
  const children = parseByLevel(fileLike, 3);
  if (children.length === 0) return [section];
  return children.map((c, i) => ({
    ...c,
    heading: `${section.heading} > ${c.heading}`,
    index: section.index * 1000 + i,
    level: 3,
  }));
}

//BM25
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
  if (max === min) return values.map(() => 1);
  return values.map((v) => (v - min) / (max - min));
}

export async function buildVectorIndexHybrid(
  embedder: EmbeddingProvider,
  sections: RequirementSection[]
): Promise<{ index: VectorIndexItem[]; bm25: Bm25Stats }> {
  const docs = sections.map((s) => {
    const text = `${s.heading}\n${s.content}`;
    const tokens = tokenize(text);
    return {
      id: `${s.filename}:${s.index}`,
      text,
      section: s,
      tokens,
      tf: buildTf(tokens),
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
    text: d.text,
    section: d.section,
    vector: vectors[i]!,
    tokens: d.tokens,
    tf: d.tf, 
  }));
  return { index, bm25 };
}

export function preprocessFiles(
  files: AutoBeAnalyzeFile[],
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

function computeDynamicK(scores: number[], kMin: number, kMax: number): number {
  if (scores.length === 0) return kMin;
  const sorted = [...scores].sort((a, b) => a - b);
  const p90 = percentile(sorted, 90);
  const p50 = percentile(sorted, 50);
  const gap = p90 - p50;
  
  const GAP_MIN = 0.02;
  const GAP_MAX = 0.20;
  const sharpness = clamp((gap - GAP_MIN) / (GAP_MAX - GAP_MIN), 0, 1);
  return Math.round(kMin + (1 - sharpness) * (kMax - kMin));
}
