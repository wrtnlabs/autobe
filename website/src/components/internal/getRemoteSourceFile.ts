import { VariadicSingleton } from "tstl";

export function getRemoteSourceFile(url: string): Promise<string> {
  return loader.get(url);
}

const loader = new VariadicSingleton(async (url) => {
  const r: Response = await fetch(url);
  if (r.status !== 200)
    throw new Error(`Failed to fetch ${url}: ${r.statusText}`);
  return await r.text();
});
