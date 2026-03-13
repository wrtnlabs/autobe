export interface LangfuseConfig {
  host: string;
  publicKey: string;
  secretKey: string;
}

export interface LangfuseTrace {
  id: string;
  name?: string | null;
  timestamp: string;
  tags?: string[] | null;
  metadata?: Record<string, unknown>;
  latency: number;
  totalCost: number;
  htmlPath: string;
  observations: string[];
  scores: string[];
}

export interface LangfuseObservation {
  id: string;
  traceId?: string | null;
  type: string;
  name?: string | null;
  model?: string | null;
  startTime: string;
  endTime?: string | null;
  latency?: number | null;
  level: string;
  input?: unknown;
  output?: unknown;
  usageDetails?: Record<string, number>;
  costDetails?: Record<string, number>;
  parentObservationId?: string | null;
}

export interface LangfusePaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

const STORAGE_KEYS = {
  host: "langfuse-host",
  publicKey: "langfuse-public-key",
  secretKey: "langfuse-secret-key",
} as const;

export function loadLangfuseConfig(): LangfuseConfig | null {
  const host = localStorage.getItem(STORAGE_KEYS.host);
  const publicKey = localStorage.getItem(STORAGE_KEYS.publicKey);
  const secretKey = localStorage.getItem(STORAGE_KEYS.secretKey);
  if (!host || !publicKey || !secretKey) return null;
  return { host, publicKey, secretKey };
}

export function saveLangfuseConfig(config: LangfuseConfig): void {
  localStorage.setItem(STORAGE_KEYS.host, config.host);
  localStorage.setItem(STORAGE_KEYS.publicKey, config.publicKey);
  localStorage.setItem(STORAGE_KEYS.secretKey, config.secretKey);
}
