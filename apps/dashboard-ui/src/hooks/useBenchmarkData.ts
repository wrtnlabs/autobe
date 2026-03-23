import { useCallback, useEffect, useState } from "react";

import type { BenchmarkData } from "../types/benchmark";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("./benchmark-summary.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json: BenchmarkData = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load benchmark data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
