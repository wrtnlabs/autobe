"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpRunner = void 0;
const DEFAULT_PORT = 37001;
class HttpRunner {
    baseUrl;
    token = null;
    constructor(port = DEFAULT_PORT) {
        this.baseUrl = `http://localhost:${port}`;
    }
    setToken(token) { this.token = token; }
    clearToken() { this.token = null; }
    async post(url, body, useToken = false) {
        return this.request("POST", url, body, useToken);
    }
    async get(url, useToken = false) {
        return this.request("GET", url, undefined, useToken);
    }
    async patch(url, body, useToken = false) {
        return this.request("PATCH", url, body, useToken);
    }
    async put(url, body, useToken = false) {
        return this.request("PUT", url, body, useToken);
    }
    async delete(url, useToken = false) {
        return this.request("DELETE", url, undefined, useToken);
    }
    resolvePath(urlTemplate, params) {
        let url = urlTemplate;
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, value);
        }
        return url;
    }
    async request(method, url, body, useToken = false) {
        const headers = { "Content-Type": "application/json" };
        if (useToken && this.token)
            headers["Authorization"] = `Bearer ${this.token}`;
        try {
            const res = await fetch(`${this.baseUrl}${url}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            let responseBody = null;
            const text = await res.text();
            try {
                responseBody = JSON.parse(text);
            }
            catch {
                responseBody = text;
            }
            return { status: res.status, body: responseBody, ok: res.status >= 200 && res.status < 300 };
        }
        catch {
            return { status: 0, body: null, ok: false };
        }
    }
}
exports.HttpRunner = HttpRunner;
//# sourceMappingURL=http-runner.js.map