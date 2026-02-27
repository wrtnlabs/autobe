import { TransformersEnvironment } from "@huggingface/transformers/types/env";
import { createHash } from "node:crypto";
import typia from "typia";

import type { EmbeddingProvider } from "./EmbeddingProvider";

interface TensorLike {
  tolist?: () => unknown;
  data?: ArrayLike<number>;
  dims?: number[];
  shape?: number[];
}

type FeatureExtractionPipeline = (
  inputs: string[] | string,
  options?: {
    pooling?: "none" | "mean" | "max";
    normalize?: boolean;
  },
) => Promise<unknown>;

export class LocalEmbeddingProvider implements EmbeddingProvider {
  public dim?: number;

  private extractorPromise: Promise<FeatureExtractionPipeline>;
  private cache = new Map<string, number[]>();

  constructor(
    private readonly options: {
      modelIdOrPath: string;

      cacheDir?: string;

      quantized?: boolean;

      batchSize?: number;

      enableCache?: boolean;
    },
  ) {
    this.extractorPromise = this.init();
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const extractor = await this.extractorPromise;
    const batchSize = this.options.batchSize ?? 32;
    const useCache = this.options.enableCache ?? true;

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

      const result = await extractor(chunkTexts, {
        pooling: "mean",
        normalize: true,
      });
      const vecs = toVectors(result);

      if (vecs.length !== chunk.length) {
        throw new Error(
          `[LocalEmbeddingProvider] batch mismatch: in=${chunk.length}, out=${vecs.length}`,
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
      if (!out[i])
        throw new Error(`[LocalEmbeddingProvider] missing vector at i=${i}`);
    }

    return out;
  }

  private async init(): Promise<FeatureExtractionPipeline> {
    const t = await import("@huggingface/transformers");
    const env: TransformersEnvironment = t.env;
    if (env && this.options.cacheDir) env.cacheDir = this.options.cacheDir;

    const pipeline = await t.pipeline(
      "feature-extraction",
      this.options.modelIdOrPath,
      {
        dtype: this.options.quantized === false ? "fp32" : "q8",
      },
    );

    return pipeline as FeatureExtractionPipeline;
  }
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toVectors(result: unknown): number[][] {
  if (typia.is<number[][]>(result)) {
    return result;
  }
  if (typia.is<number[]>(result)) {
    return [result];
  }

  if (typia.is<TensorLike>(result)) {
    if (typeof result.tolist === "function") {
      const arr = result.tolist();
      if (typia.is<number[][]>(arr)) return arr;
      if (typia.is<number[]>(arr)) return [arr];
    }

    const data: number[] = Array.from(result.data ?? []);
    const dims: number[] = Array.from(result.dims ?? result.shape ?? []);

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
