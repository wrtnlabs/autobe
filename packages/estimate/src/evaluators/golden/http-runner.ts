const DEFAULT_PORT = 37001;

export interface HttpResponse {
  status: number;
  body: any;
  ok: boolean;
  /** Response time in milliseconds */
  durationMs: number;
}

export class HttpRunner {
  private baseUrl: string;
  private token: string | null = null;

  constructor(port: number = DEFAULT_PORT) {
    this.baseUrl = `http://localhost:${port}`;
  }

  setToken(token: string) {
    this.token = token;
  }
  clearToken() {
    this.token = null;
  }

  async post(
    url: string,
    body?: unknown,
    useToken = false,
  ): Promise<HttpResponse> {
    return this.request("POST", url, body, useToken);
  }
  async get(url: string, useToken = false): Promise<HttpResponse> {
    return this.request("GET", url, undefined, useToken);
  }
  async patch(
    url: string,
    body?: unknown,
    useToken = false,
  ): Promise<HttpResponse> {
    return this.request("PATCH", url, body, useToken);
  }
  async put(
    url: string,
    body?: unknown,
    useToken = false,
  ): Promise<HttpResponse> {
    return this.request("PUT", url, body, useToken);
  }
  async delete(url: string, useToken = false): Promise<HttpResponse> {
    return this.request("DELETE", url, undefined, useToken);
  }

  resolvePath(urlTemplate: string, params: Record<string, string>): string {
    let url = urlTemplate;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, value);
    }
    return url;
  }

  private async request(
    method: string,
    url: string,
    body?: unknown,
    useToken = false,
  ): Promise<HttpResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (useToken && this.token)
      headers["Authorization"] = `Bearer ${this.token}`;
    const start = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      let responseBody: any = null;
      const text = await res.text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }
      return {
        status: res.status,
        body: responseBody,
        ok: res.status >= 200 && res.status < 300,
        durationMs: Math.round(performance.now() - start),
      };
    } catch {
      return {
        status: 0,
        body: null,
        ok: false,
        durationMs: Math.round(performance.now() - start),
      };
    }
  }
}
