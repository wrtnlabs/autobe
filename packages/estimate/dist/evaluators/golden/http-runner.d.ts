export interface HttpResponse {
    status: number;
    body: any;
    ok: boolean;
}
export declare class HttpRunner {
    private baseUrl;
    private token;
    constructor(port?: number);
    setToken(token: string): void;
    clearToken(): void;
    post(url: string, body?: any, useToken?: boolean): Promise<HttpResponse>;
    get(url: string, useToken?: boolean): Promise<HttpResponse>;
    patch(url: string, body?: any, useToken?: boolean): Promise<HttpResponse>;
    put(url: string, body?: any, useToken?: boolean): Promise<HttpResponse>;
    delete(url: string, useToken?: boolean): Promise<HttpResponse>;
    resolvePath(urlTemplate: string, params: Record<string, string>): string;
    private request;
}
//# sourceMappingURL=http-runner.d.ts.map