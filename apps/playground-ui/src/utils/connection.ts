import pApi from "@autobe/playground-api";

const DEFAULT_SERVER_URL = "http://127.0.0.1:5890";
const STORAGE_KEY = "autobe_server_url";

export function getServerUrl(): string {
  if (typeof window === "undefined") return DEFAULT_SERVER_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_SERVER_URL;
}

export function getConnection(): pApi.IConnection {
  return { host: getServerUrl() };
}
