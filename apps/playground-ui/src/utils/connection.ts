import pApi from "@autobe/playground-api";

export function getServerUrl(): string {
  return "http://127.0.0.1:5889";
}

export function getConnection(): pApi.IConnection {
  return { host: getServerUrl() };
}
