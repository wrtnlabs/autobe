import { createHash } from "node:crypto";
import type { EmbeddingProvider } from "./LocalEmbeddingProvider";

type FeatureExtractionPipeline = (
  inputs: string[] | string,
  options?: {
    pooling?: "none" | "mean" | "max";
    normalize?: boolean;
  }
) => Promise<unknown>;

export class LocalEmbeddingProvider implements EmbeddingProvider {
  public dim?: number;

  private extractorPromise: Promise<FeatureExtractionPipeline>;
  private cache = new Map<string, number[]>();

  constructor(
    private readonly opts: {

      modelIdOrPath: string;

      cacheDir?: string;

      quantized?: boolean;

      batchSize?: number;

      enableCache?: boolean;
    }
  ) {
    this.extractorPromise = this.init();
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const extractor = await this.extractorPromise;
    const batchSize = this.opts.batchSize ?? 32;
    const useCache = this.opts.enableCache ?? true;

    const out: number[][] = new Array(texts.length);
    const misses: { idx: number; text: string; key: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const t = texts[i] ?? "";
      const key = hashText(t);
      const hit = useCache ? this.cache.get(key) : undefined;
      if (hit) out[i] = hit;
      else misses.push({ idx: i, text: t, key });
    }

    for (let i = 0; i < misses.length; i += batchSize) {
      const chunk = misses.slice(i, i + batchSize);
      const chunkTexts = chunk.map((c) => c.text);

      const result = await extractor(chunkTexts, { pooling: "mean", normalize: true });
      const vecs = toVectors(result);

      if (vecs.length !== chunk.length) {
        throw new Error(
          `[LocalEmbeddingProvider] batch mismatch: in=${chunk.length}, out=${vecs.length}`
        );
      }

      if (!this.dim && vecs[0]) this.dim = vecs[0].length;

      for (let j = 0; j < chunk.length; j++) {
        const v = vecs[j]!;
        const { idx, key } = chunk[j]!;
        out[idx] = v;
        if (useCache) this.cache.set(key, v);
      }
    }

    for (let i = 0; i < out.length; i++) {
      if (!out[i]) throw new Error(`[LocalEmbeddingProvider] missing vector at i=${i}`);
    }

    return out;
  }

  private async init(): Promise<FeatureExtractionPipeline> {
    const t = await import("@xenova/transformers");
    const envAny = (t as any).env;
    if (envAny && this.opts.cacheDir) envAny.cacheDir = this.opts.cacheDir;

    const pipeline = await t.pipeline("feature-extraction", this.opts.modelIdOrPath, {
      quantized: this.opts.quantized ?? true,
    });

    return pipeline as FeatureExtractionPipeline;
  }
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toVectors(result: unknown): number[][] {
  if (Array.isArray(result) && Array.isArray(result[0]) && typeof (result as any)[0][0] === "number") {
    return result as number[][];
  }
  if (Array.isArray(result) && typeof (result as any)[0] === "number") {
    return [result as number[]];
  }

  const r: any = result;
  if (r && (r.tolist || r.data) && (r.dims || r.shape)) {
    if (typeof r.tolist === "function") {
      const arr = r.tolist();
      if (Array.isArray(arr) && Array.isArray(arr[0])) return arr as number[][];
      if (Array.isArray(arr) && typeof arr[0] === "number") return [arr as number[]];
    }

    const data: number[] = Array.from(r.data ?? []);
    const dims: number[] = Array.from(r.dims ?? r.shape ?? []);

    if (dims.length === 2) {
      const [B, D] = dims;
      const out: number[][] = [];
      for (let b = 0; b < B; b++) out.push(data.slice(b * D, (b + 1) * D));
      return out;
    }
    if (dims.length === 1) return [data];
  }

  throw new Error("[LocalEmbeddingProvider] unsupported embedding output");
}
