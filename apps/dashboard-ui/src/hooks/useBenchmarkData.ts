import { useCallback, useEffect, useRef, useState } from "react";

import type { BenchmarkData } from "../types/benchmark";

const POLL_INTERVAL = 10_000; // 10 seconds

interface UseBenchmarkDataResult {
  data: BenchmarkData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useBenchmarkData(): UseBenchmarkDataResult {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastJson = useRef("");

  const load = useCallback(async (isPolling = false) => {
    if (!isPolling) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`./benchmark-summary.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const text = await res.text();
      // Only update state if data actually changed
      if (text !== lastJson.current) {
        lastJson.current = text;
        setData(JSON.parse(text));
      }
      if (!isPolling) setError(null);
    } catch (err) {
      if (!isPolling) {
        setError(
          err instanceof Error ? err.message : "Failed to load benchmark data",
        );
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  return { data, loading, error, reload: () => load() };
}
