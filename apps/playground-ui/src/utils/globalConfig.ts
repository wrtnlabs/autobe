import { IAutoBePlaygroundConfig } from "@autobe/interface";
import pApi from "@autobe/playground-api";

import { getConnection } from "./connection";

const FALLBACK: IAutoBePlaygroundConfig = {
  locale: "en-US",
  timezone: "UTC",
  default_vendor_id: null,
  default_model: null,
};

let cached: IAutoBePlaygroundConfig | null = null;
let inflight: Promise<IAutoBePlaygroundConfig> | null = null;

export async function getGlobalConfig(): Promise<IAutoBePlaygroundConfig> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = pApi.functional.autobe.playground.config
    .get(getConnection())
    .then((config) => {
      cached = config;
      return config;
    })
    .catch((err) => {
      console.warn("Failed to fetch global config, using defaults:", err);
      inflight = null;
      return FALLBACK;
    });

  return inflight;
}

export function invalidateGlobalConfigCache(): void {
  cached = null;
  inflight = null;
}
