import OpenAI from "openai";

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

// Embedding
async function embed(openai: OpenAI, texts: string[]): Promise<number[][]> {
  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  } catch (err) {
    console.error("[VectorDB] embed failed", { count: texts.length, err });
    throw err;
  }
}

// Cosine Similarity
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

// Parse (H2/H3)
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