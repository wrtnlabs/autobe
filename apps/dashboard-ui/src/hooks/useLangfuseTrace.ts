import { useCallback, useEffect, useState } from "react";

import type {
  LangfuseObservation,
  LangfusePaginatedResponse,
  LangfuseTrace,
} from "../types/langfuse";
import { loadLangfuseConfig } from "../types/langfuse";

interface UseLangfuseTraceResult {
  trace: LangfuseTrace | null;
  observations: LangfuseObservation[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  reload: () => void;
}

async function langfuseFetch<T>(
  path: string,
  publicKey: string,
  secretKey: string,
): Promise<T> {
  const res = await fetch(`/api/langfuse${path}`, {
    headers: {
      Authorization: `Basic ${btoa(`${publicKey}:${secretKey}`)}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Langfuse API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// Benchmark model short names → Langfuse trace model names
const MODEL_TO_LANGFUSE_NAME: Record<string, string> = {
  "qwen3-80b": "qwen3-next-80b-a3b-instruct",
  "qwen3-coder": "qwen3-coder-next",
  "qwen3-30b": "qwen3-30b-a3b-thinking-2507",
  "gpt-4.1-mini": "gpt-4.1-mini",
  "gpt-4.1": "gpt-4.1",
  "gpt-4.1-mini-v2": "gpt-4.1-mini",
  "deepseek-v3.1": "deepseek-v3.1-terminus-exacto",
};

export function useLangfuseTrace(
  model: string,
  project: string,
): UseLangfuseTraceResult {
  const [trace, setTrace] = useState<LangfuseTrace | null>(null);
  const [observations, setObservations] = useState<LangfuseObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const config = loadLangfuseConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    setConfigured(true);

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const langfuseModel = MODEL_TO_LANGFUSE_NAME[model] ?? model;
        const traceName = `estimate/${langfuseModel}/${project}`;
        const tracesRes = await langfuseFetch<
          LangfusePaginatedResponse<LangfuseTrace>
        >(
          `/traces?name=${encodeURIComponent(traceName)}&limit=1&orderBy=timestamp.desc`,
          config.publicKey,
          config.secretKey,
        );

        if (cancelled) return;
        if (tracesRes.data.length === 0) {
          setTrace(null);
          setObservations([]);
          setLoading(false);
          return;
        }

        const t = tracesRes.data[0];
        setTrace(t);

        const obsRes = await langfuseFetch<
          LangfusePaginatedResponse<LangfuseObservation>
        >(
          `/observations?traceId=${t.id}&limit=100`,
          config.publicKey,
          config.secretKey,
        );

        if (cancelled) return;
        setObservations(obsRes.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [model, project, reloadKey]);

  return { trace, observations, loading, error, configured, reload };
}
