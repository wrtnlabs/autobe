import { VariadicSingleton } from "tstl";

export function getRemoteSourceFile(url: string): Promise<string> {
  return loader.get(url);
}

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

async function fetchWithRetry(url: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const r: Response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (r.status !== 200)
        throw new Error(`Failed to fetch ${url}: ${r.statusText}`);
      return await r.text();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, 1_000 * Math.pow(2, attempt - 1)),
      );
    }
  }
  throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts`);
}

const loader = new VariadicSingleton(fetchWithRetry);
