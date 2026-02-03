// local embedding
import { LocalEmbeddingProvider } from "./LocalEmbeddingProvider";

let _embedder: LocalEmbeddingProvider | null = null;

export function getEmbedder(): LocalEmbeddingProvider {
  if (!_embedder) {
    _embedder = new LocalEmbeddingProvider({
      modelIdOrPath: "Xenova/all-MiniLM-L6-v2",
      quantized: true,
      batchSize: 32,
      enableCache: true,
    });
  }
  return _embedder;
}
