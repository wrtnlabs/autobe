import type { EvaluationContext, Issue, PhaseResult } from "../../types";
import { PHASE_WEIGHTS, createIssue } from "../../types";
import { HttpRunner } from "./http-runner";
import { loadOpenApiSpec, resolveRef } from "./response-validator";
import type { ScenarioCategory, ScenarioResult } from "./scenario-helpers";

/**
 * OpenAPI Contract Evaluator — auto-generates API tests from swagger.json.
 *
 * Unlike the hardcoded GoldenSet scenarios, this evaluator works for ANY
 * project by parsing its swagger.json to discover endpoints, generating minimal
 * valid request bodies from schemas, and verifying that responses match
 * declared response schemas.
 */

// ── Schema types ────────────────────────────────────────────

interface OpenApiSchema {
  type?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  $ref?: string;
  required?: string[];
  enum?: unknown[];
  format?: string;
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  allOf?: OpenApiSchema[];
  default?: unknown;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

interface PathParam {
  name: string;
  schema?: OpenApiSchema;
}

interface EndpointSpec {
  path: string;
  method: string;
  requestBodySchema?: OpenApiSchema;
  responseSchema?: OpenApiSchema;
  requiresAuth: boolean;
  category: ScenarioCategory;
  pathParams: PathParam[];
}

interface ContractTestResult extends ScenarioResult {
  endpoint: string;
  method: string;
  statusCode?: number;
  responseWarnings: string[];
  skipped?: boolean;
}

// ── Score ratios (same structure as GoldenSetEvaluator) ─────

// C-3 + M-2: Response time removed (environment-dependent, not code quality)
// Ratios aligned with GoldenSetEvaluator philosophy
const SCHEMA_MATCH_RATIO = 0.6; // response matches declared schema
const STATUS_CODE_RATIO = 0.4; // correct HTTP status code

// ── Max endpoints to test (cost/time guard) ─────────────────

const MAX_ENDPOINTS = 80;

export class ContractEvaluator {
  readonly name = "ContractEvaluator";

  async evaluate(
    context: EvaluationContext,
    port?: number,
  ): Promise<PhaseResult> {
    const startTime = performance.now();
    const issues: Issue[] = [];

    const spec = loadOpenApiSpec(context.project.rootPath);
    if (!spec) {
      return this.emptyResult("No swagger.json/openapi.json found", startTime);
    }

    const endpoints = this.extractEndpoints(spec);
    if (endpoints.length === 0) {
      return this.emptyResult("No endpoints found in spec", startTime);
    }

    const http = new HttpRunner(port);
    const results: ContractTestResult[] = [];
    // Collected resource IDs from POST responses: resource name → id string
    const resourceIds = new Map<string, string>();

    // 1. Find auth endpoint and get token
    const authToken = await this.tryAuthenticate(spec, endpoints, http);

    // 2. Test each endpoint (two-phase: create first, then parameterized)
    const toTest = this.selectEndpoints(endpoints);
    console.log(
      `  ${this.name}: testing ${toTest.length}/${endpoints.length} endpoints from spec`,
    );

    // Phase 1: Run non-parameterized POST endpoints first to collect resource IDs
    const createEndpoints = toTest.filter(
      (ep) => ep.method === "POST" && ep.pathParams.length === 0,
    );
    const rest = toTest.filter(
      (ep) => !(ep.method === "POST" && ep.pathParams.length === 0),
    );

    for (const ep of createEndpoints) {
      const result = await this.testEndpoint(
        spec,
        ep,
        http,
        authToken,
        resourceIds,
      );
      results.push(result);
    }

    // Phase 2: Run remaining endpoints (parameterized GET/PATCH/DELETE etc.)
    for (const ep of rest) {
      const result = await this.testEndpoint(
        spec,
        ep,
        http,
        authToken,
        resourceIds,
      );
      results.push(result);
    }

    // 3. Score
    const score = this.computeScore(results);

    // 4. Build issues
    for (const r of results) {
      if (!r.passed) {
        issues.push(
          createIssue({
            severity: "warning",
            category: "runtime",
            code: "CT001",
            message: `[CONTRACT] ${r.method} ${r.endpoint}: ${r.reason ?? "failed"}`,
          }),
        );
      }
      for (const w of r.responseWarnings) {
        issues.push(
          createIssue({
            severity: "suggestion",
            category: "runtime",
            code: "CT002",
            message: `[SCHEMA] ${r.method} ${r.endpoint}: ${w}`,
          }),
        );
      }
    }

    const scoreable = results.filter((r) => !r.skipped);
    const skipped = results.length - scoreable.length;
    const total = scoreable.length;
    const passed = scoreable.filter((r) => r.passed).length;
    const timings = scoreable
      .map((r) => r.durationMs)
      .filter((d): d is number => d !== undefined);
    const avgMs =
      timings.length > 0
        ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
        : 0;

    return {
      phase: "goldenSet",
      passed: passed === total,
      score,
      maxScore: 100,
      weightedScore: score * (PHASE_WEIGHTS.goldenSet ?? 0),
      issues,
      durationMs: Math.round(performance.now() - startTime),
      metrics: {
        contractEndpoints: total,
        contractSkipped: skipped,
        contractPassed: passed,
        contractFailed: total - passed,
        contractPassRate: Math.round((passed / Math.max(total, 1)) * 100),
        contractAvgResponseMs: avgMs,
        contractSchemaWarnings: results.reduce(
          (sum, r) => sum + r.responseWarnings.length,
          0,
        ),
      },
    };
  }

  // ── Endpoint extraction ───────────────────────────────────

  private extractEndpoints(spec: Record<string, unknown>): EndpointSpec[] {
    const paths = spec.paths as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    if (!paths) return [];

    const endpoints: EndpointSpec[] = [];

    for (const [apiPath, methods] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (!["get", "post", "put", "patch", "delete"].includes(method))
          continue;

        const requestBodySchema = this.extractRequestBodySchema(spec, op);
        const responseSchema = this.extractResponseSchema(spec, op);
        const requiresAuth = this.detectAuth(op);
        const category = this.categorizeEndpoint(apiPath, method);
        const pathParams = this.extractPathParams(spec, op, apiPath);

        endpoints.push({
          path: apiPath,
          method: method.toUpperCase(),
          requestBodySchema: requestBodySchema ?? undefined,
          responseSchema: responseSchema ?? undefined,
          requiresAuth,
          category,
          pathParams,
        });
      }
    }

    return endpoints;
  }

  private extractRequestBodySchema(
    spec: Record<string, unknown>,
    op: Record<string, unknown>,
  ): OpenApiSchema | null {
    const rb = op.requestBody as {
      content?: Record<string, { schema?: OpenApiSchema }>;
    };
    if (!rb?.content) return null;

    const jsonContent = rb.content["application/json"] || rb.content["*/*"];
    if (!jsonContent?.schema) return null;

    let schema = jsonContent.schema;
    if (schema.$ref) {
      schema = (resolveRef(spec, schema.$ref) as OpenApiSchema) ?? schema;
    }
    return schema;
  }

  private extractResponseSchema(
    spec: Record<string, unknown>,
    op: Record<string, unknown>,
  ): OpenApiSchema | null {
    const responses = op.responses as Record<
      string,
      { content?: Record<string, { schema?: OpenApiSchema }> }
    >;
    if (!responses) return null;

    for (const code of ["200", "201", "2XX", "default"]) {
      const resp = responses[code];
      if (!resp?.content) continue;
      const jsonContent =
        resp.content["application/json"] || resp.content["*/*"];
      if (jsonContent?.schema) {
        let schema = jsonContent.schema;
        if (schema.$ref) {
          schema = (resolveRef(spec, schema.$ref) as OpenApiSchema) ?? schema;
        }
        return schema;
      }
    }
    return null;
  }

  private detectAuth(op: Record<string, unknown>): boolean {
    // Check for security requirement on the operation
    if (op.security && Array.isArray(op.security) && op.security.length > 0)
      return true;
    // Heuristic: operations with bearer/token parameters
    const params = op.parameters as Array<{ in?: string; name?: string }>;
    if (params) {
      return params.some(
        (p) =>
          p.in === "header" && p.name?.toLowerCase().includes("authorization"),
      );
    }
    return false;
  }

  private extractPathParams(
    spec: Record<string, unknown>,
    op: Record<string, unknown>,
    apiPath: string,
  ): PathParam[] {
    const params: PathParam[] = [];

    // 1. Extract from OpenAPI `parameters` array
    const opParams = op.parameters as
      | Array<{
          in?: string;
          name?: string;
          schema?: OpenApiSchema;
          $ref?: string;
        }>
      | undefined;

    if (opParams) {
      for (const p of opParams) {
        let resolved = p;
        if (p.$ref) {
          const r = resolveRef(spec, p.$ref) as typeof p | null;
          if (r) resolved = r;
        }
        if (resolved.in === "path" && resolved.name) {
          params.push({
            name: resolved.name,
            schema: resolved.schema,
          });
        }
      }
    }

    // 2. Fallback: extract from path template itself ({id}, {userId}, etc.)
    const templateParams = apiPath.match(/\{([^}]+)\}/g) ?? [];
    for (const tpl of templateParams) {
      const name = tpl.slice(1, -1); // strip { }
      if (!params.some((p) => p.name === name)) {
        params.push({ name });
      }
    }

    // 3. Handle :param style (NestJS)
    const colonParams = apiPath.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g) ?? [];
    for (const tpl of colonParams) {
      const name = tpl.slice(1); // strip :
      if (!params.some((p) => p.name === name)) {
        params.push({ name });
      }
    }

    return params;
  }

  private categorizeEndpoint(
    apiPath: string,
    method: string,
  ): ScenarioCategory {
    const lower = apiPath.toLowerCase();
    if (
      lower.includes("auth") ||
      lower.includes("login") ||
      lower.includes("join")
    )
      return "auth";
    if (method === "delete") return "cleanup";
    if (method === "get" || method === "patch") {
      // PATCH in AutoBE convention = paginated query
      if (method === "patch" && !lower.includes(":") && !lower.includes("{"))
        return "query";
      if (method === "get") return "query";
    }
    if (method === "post" || method === "put") return "crud";
    return "crud";
  }

  // ── Endpoint selection (prioritize variety) ───────────────

  private selectEndpoints(endpoints: EndpointSpec[]): EndpointSpec[] {
    if (endpoints.length <= MAX_ENDPOINTS) return endpoints;

    // Stratified sampling: ensure coverage across categories
    const byCategory = new Map<ScenarioCategory, EndpointSpec[]>();
    for (const ep of endpoints) {
      const list = byCategory.get(ep.category) ?? [];
      list.push(ep);
      byCategory.set(ep.category, list);
    }

    const selected: EndpointSpec[] = [];
    const perCategory = Math.floor(MAX_ENDPOINTS / byCategory.size);

    for (const [, eps] of byCategory) {
      const take = Math.min(eps.length, perCategory);
      // Take first N (auth endpoints first, then by path)
      selected.push(...eps.slice(0, take));
    }

    // Fill remaining slots
    const selectedPaths = new Set(selected.map((e) => `${e.method} ${e.path}`));
    for (const ep of endpoints) {
      if (selected.length >= MAX_ENDPOINTS) break;
      if (!selectedPaths.has(`${ep.method} ${ep.path}`)) {
        selected.push(ep);
      }
    }

    return selected;
  }

  // ── Authentication ────────────────────────────────────────

  private async tryAuthenticate(
    spec: Record<string, unknown>,
    endpoints: EndpointSpec[],
    http: HttpRunner,
  ): Promise<string | null> {
    // Find join/signup endpoint
    const joinEp = endpoints.find(
      (e) =>
        e.method === "POST" &&
        (e.path.includes("join") ||
          e.path.includes("signup") ||
          e.path.includes("register")),
    );

    if (!joinEp || !joinEp.requestBodySchema) {
      // Try login
      const loginEp = endpoints.find(
        (e) => e.method === "POST" && e.path.includes("login"),
      );
      if (loginEp?.requestBodySchema) {
        const body = this.generateRequestBody(spec, loginEp.requestBodySchema);
        const res = await http.post(loginEp.path, body);
        return this.extractToken(res.body);
      }
      return null;
    }

    const body = this.generateRequestBody(spec, joinEp.requestBodySchema);
    const res = await http.post(joinEp.path, body);
    if (res.ok) {
      const token = this.extractToken(res.body);
      if (token) {
        http.setToken(token);
        return token;
      }
    }

    return null;
  }

  private extractToken(body: unknown): string | null {
    if (!body || typeof body !== "object") return null;
    const obj = body as Record<string, unknown>;

    // Common token locations
    for (const key of [
      "token",
      "access_token",
      "accessToken",
      "access",
      "jwt",
    ]) {
      if (typeof obj[key] === "string") return obj[key] as string;
    }

    // Nested in data/result
    for (const wrapper of ["data", "result", "response"]) {
      if (typeof obj[wrapper] === "object" && obj[wrapper] !== null) {
        const inner = obj[wrapper] as Record<string, unknown>;
        for (const key of [
          "token",
          "access_token",
          "accessToken",
          "access",
          "jwt",
        ]) {
          if (typeof inner[key] === "string") return inner[key] as string;
        }
      }
    }

    return null;
  }

  // ── Request body generation ───────────────────────────────

  private generateRequestBody(
    spec: Record<string, unknown>,
    schema: OpenApiSchema,
  ): Record<string, unknown> {
    return this.generateFromSchema(spec, schema, 0) as Record<string, unknown>;
  }

  private generateFromSchema(
    spec: Record<string, unknown>,
    schema: OpenApiSchema,
    depth: number,
  ): unknown {
    if (depth > 5) return null; // prevent infinite recursion

    // Resolve $ref
    if (schema.$ref) {
      const resolved = resolveRef(spec, schema.$ref) as OpenApiSchema | null;
      if (!resolved) return null;
      return this.generateFromSchema(spec, resolved, depth + 1);
    }

    // Handle allOf
    if (schema.allOf) {
      const merged: Record<string, unknown> = {};
      for (const sub of schema.allOf) {
        const val = this.generateFromSchema(spec, sub, depth + 1);
        if (typeof val === "object" && val !== null) {
          Object.assign(merged, val);
        }
      }
      return merged;
    }

    // Handle oneOf/anyOf — pick first
    if (schema.oneOf?.[0]) {
      return this.generateFromSchema(spec, schema.oneOf[0], depth + 1);
    }
    if (schema.anyOf?.[0]) {
      return this.generateFromSchema(spec, schema.anyOf[0], depth + 1);
    }

    // Default value
    if (schema.default !== undefined) return schema.default;

    // Enum — pick first
    if (schema.enum && schema.enum.length > 0) return schema.enum[0];

    switch (schema.type) {
      case "object": {
        const obj: Record<string, unknown> = {};
        if (schema.properties) {
          // Only generate required fields + a few optional ones
          const required = new Set(schema.required ?? []);
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (
              required.has(key) ||
              Object.keys(schema.properties).length <= 5
            ) {
              obj[key] = this.generateFromSchema(spec, propSchema, depth + 1);
            }
          }
        }
        return obj;
      }
      case "array":
        if (schema.items) {
          return [this.generateFromSchema(spec, schema.items, depth + 1)];
        }
        return [];
      case "string":
        return this.generateString(schema);
      case "number":
      case "integer":
        return this.generateNumber(schema);
      case "boolean":
        return true;
      default:
        // If no type but has properties, treat as object
        if (schema.properties) {
          const obj: Record<string, unknown> = {};
          const required = new Set(schema.required ?? []);
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (required.has(key)) {
              obj[key] = this.generateFromSchema(spec, propSchema, depth + 1);
            }
          }
          return obj;
        }
        return null;
    }
  }

  private generateString(schema: OpenApiSchema): string {
    const fmt = schema.format;
    if (fmt === "uuid") return "00000000-0000-4000-8000-000000000001";
    if (fmt === "email" || fmt === "idn-email")
      return `contract_test_${Date.now()}@test.com`;
    if (fmt === "uri" || fmt === "url") return "https://example.com";
    if (fmt === "date-time" || fmt === "date") return new Date().toISOString();
    if (fmt === "password") return "ContractTest1!";

    const minLen = schema.minLength ?? 1;
    return "test_" + "x".repeat(Math.max(0, minLen - 5));
  }

  private generateNumber(schema: OpenApiSchema): number {
    if (schema.minimum !== undefined) return schema.minimum;
    if (schema.maximum !== undefined) return Math.min(schema.maximum, 10);
    return schema.type === "integer" ? 1 : 1.0;
  }

  // ── Endpoint testing ──────────────────────────────────────

  private async testEndpoint(
    spec: Record<string, unknown>,
    ep: EndpointSpec,
    http: HttpRunner,
    authToken: string | null,
    resourceIds: Map<string, string>,
  ): Promise<ContractTestResult> {
    const useToken = ep.requiresAuth && authToken !== null;
    const warnings: string[] = [];

    try {
      let res;

      // Resolve path parameters using collected resource IDs
      const path = this.resolvePathParams(ep, resourceIds);
      if (path === null) {
        // No ID available for required path params — skip
        console.log(
          `    skip: ${ep.method} ${ep.path} (no resource ID available)`,
        );
        return {
          id: 0,
          name: `${ep.method} ${ep.path}`,
          passed: false,
          category: ep.category,
          endpoint: ep.path,
          method: ep.method,
          responseWarnings: [],
          reason: "skipped (no resource ID for path params)",
          skipped: true,
        };
      }

      switch (ep.method) {
        case "GET":
          res = await http.get(path, useToken);
          break;
        case "POST": {
          const body = ep.requestBodySchema
            ? this.generateRequestBody(spec, ep.requestBodySchema)
            : {};
          res = await http.post(path, body, useToken);
          // Collect resource ID from successful creation
          if (res.ok && res.body) {
            this.collectResourceId(ep.path, res.body, resourceIds);
          }
          break;
        }
        case "PATCH": {
          const body = ep.requestBodySchema
            ? this.generateRequestBody(spec, ep.requestBodySchema)
            : {};
          res = await http.patch(path, body, useToken);
          break;
        }
        case "PUT": {
          const body = ep.requestBodySchema
            ? this.generateRequestBody(spec, ep.requestBodySchema)
            : {};
          res = await http.put(path, body, useToken);
          break;
        }
        case "DELETE":
          res = await http.delete(path, useToken);
          break;
        default:
          return {
            id: 0,
            name: `${ep.method} ${ep.path}`,
            passed: true,
            category: ep.category,
            endpoint: ep.path,
            method: ep.method,
            responseWarnings: [],
          };
      }

      // Validate status code
      const statusOk = this.validateStatusCode(ep, res.status);

      // Validate response schema
      if (res.ok && ep.responseSchema && res.body) {
        const schemaWarnings = this.validateResponseSchema(
          spec,
          res.body,
          ep.responseSchema,
        );
        warnings.push(...schemaWarnings);
      }

      const passed =
        statusOk && (res.ok || this.isExpectedError(ep, res.status));

      return {
        id: 0,
        name: `${ep.method} ${ep.path}`,
        passed,
        reason: passed
          ? undefined
          : `HTTP ${res.status}${!statusOk ? " (unexpected status)" : ""}`,
        category: ep.category,
        endpoint: ep.path,
        method: ep.method,
        statusCode: res.status,
        durationMs: res.durationMs,
        schemaWarnings: warnings.length > 0 ? warnings : undefined,
        responseWarnings: warnings,
      };
    } catch (error) {
      return {
        id: 0,
        name: `${ep.method} ${ep.path}`,
        passed: false,
        reason: `Request error: ${error instanceof Error ? error.message : "unknown"}`,
        category: ep.category,
        endpoint: ep.path,
        method: ep.method,
        responseWarnings: [],
      };
    }
  }

  /**
   * Resolve path parameters using collected resource IDs. Returns the resolved
   * path, or null if a required param has no available ID.
   */
  private resolvePathParams(
    ep: EndpointSpec,
    resourceIds: Map<string, string>,
  ): string | null {
    if (ep.pathParams.length === 0) return ep.path;

    let resolved = ep.path;
    for (const param of ep.pathParams) {
      const id = this.findResourceId(param.name, ep.path, resourceIds);
      if (!id) return null; // Can't resolve — skip this endpoint

      // Replace both {param} and :param styles
      resolved = resolved
        .replaceAll(`{${param.name}}`, id)
        .replaceAll(`:${param.name}`, id);
    }
    return resolved;
  }

  /**
   * Find a resource ID for a path parameter by matching param name to resource
   * names.
   */
  private findResourceId(
    paramName: string,
    apiPath: string,
    resourceIds: Map<string, string>,
  ): string | null {
    // Direct match: "id" → look for resource from parent path segment
    // e.g., /articles/{id} → resource "articles"
    // e.g., /articles/{articleId} → resource "articles"
    const lower = paramName.toLowerCase();

    // 1. If param is just "id", infer resource from path
    if (lower === "id") {
      const resource = this.inferResourceFromPath(apiPath);
      if (resource && resourceIds.has(resource)) {
        return resourceIds.get(resource)!;
      }
      // Fallback: return any available ID (most recent)
      const lastId = [...resourceIds.values()].pop();
      return lastId ?? null;
    }

    // 2. If param is like "articleId" or "article_id", extract "article" → pluralize
    const resourceName = lower
      .replace(/id$/i, "")
      .replace(/_id$/i, "")
      .replace(/-id$/i, "");
    if (resourceName) {
      // Try plural forms
      for (const suffix of ["s", "es", ""]) {
        const key = resourceName + suffix;
        if (resourceIds.has(key)) return resourceIds.get(key)!;
      }
    }

    // 3. Try matching against all resource keys
    for (const [key, id] of resourceIds) {
      if (key.includes(resourceName) || resourceName.includes(key)) {
        return id;
      }
    }

    return null;
  }

  /** Infer resource name from path: /api/articles/{id} → "articles" */
  private inferResourceFromPath(apiPath: string): string | null {
    const segments = apiPath.split("/").filter(Boolean);
    // Find the segment just before the first path param
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].startsWith("{") || segments[i].startsWith(":")) {
        return i > 0 ? segments[i - 1].toLowerCase() : null;
      }
    }
    return null;
  }

  /** Extract resource ID from a POST response body and store it. */
  private collectResourceId(
    apiPath: string,
    body: unknown,
    resourceIds: Map<string, string>,
  ): void {
    if (!body || typeof body !== "object") return;

    const id = this.extractId(body);
    if (!id) return;

    // Derive resource name from path: /api/articles → "articles"
    const segments = apiPath.split("/").filter(Boolean);
    // Take the last non-param segment
    for (let i = segments.length - 1; i >= 0; i--) {
      if (!segments[i].startsWith("{") && !segments[i].startsWith(":")) {
        resourceIds.set(segments[i].toLowerCase(), id);
        return;
      }
    }
  }

  /**
   * Extract an ID value from a response body object. Handles both flat and
   * nested (data/result wrapper) structures.
   */
  private extractId(body: unknown): string | null {
    if (!body || typeof body !== "object") return null;
    const obj = body as Record<string, unknown>;

    // Check flat ID fields
    const idValue = this.extractIdFromObject(obj);
    if (idValue) return idValue;

    // Check nested wrappers
    for (const wrapper of ["data", "result", "response"]) {
      if (typeof obj[wrapper] === "object" && obj[wrapper] !== null) {
        const inner = obj[wrapper] as Record<string, unknown>;
        const innerId = this.extractIdFromObject(inner);
        if (innerId) return innerId;
      }
    }

    return null;
  }

  private extractIdFromObject(obj: Record<string, unknown>): string | null {
    for (const key of ["id", "ID", "_id"]) {
      const val = obj[key];
      if (typeof val === "string" && val.length > 0) return val;
      if (typeof val === "number") return String(val);
    }
    return null;
  }

  private validateStatusCode(ep: EndpointSpec, status: number): boolean {
    // Status 0 = connection refused
    if (status === 0) return false;

    // 2xx = success
    if (status >= 200 && status < 300) return true;

    // Auth endpoints: 400/401/403 with bad credentials is expected
    if (ep.category === "auth" && [400, 401, 403].includes(status)) return true;

    // 400 = validation error (expected with generated request bodies)
    if (status === 400) return true;

    // 404 = route not found — the endpoint doesn't exist, fail
    // 405 = method not allowed — route exists but wrong method
    // 401/403 = auth required — route exists but needs credentials
    if (status === 404 || status === 405) return false;
    if (status === 401 || status === 403) return true; // route exists

    // Other 4xx = fail (409 conflict, 422 unprocessable, etc. are ambiguous)
    if (status >= 400 && status < 500) return true;

    // 5xx = server error = fail
    return false;
  }

  private isExpectedError(ep: EndpointSpec, status: number): boolean {
    // Only specific 4xx are expected — 404/405 are NOT expected
    return (
      status === 400 ||
      status === 401 ||
      status === 403 ||
      status === 409 ||
      status === 422
    );
  }

  // ── Response schema validation ────────────────────────────

  private validateResponseSchema(
    spec: Record<string, unknown>,
    body: unknown,
    schema: OpenApiSchema,
    depth: number = 0,
  ): string[] {
    const warnings: string[] = [];

    if (body === null || body === undefined) {
      if (schema.type && schema.type !== "null") {
        warnings.push("Response body is null but schema expects non-null");
      }
      return warnings;
    }

    // Resolve $ref
    let resolved = schema;
    if (schema.$ref) {
      const r = resolveRef(spec, schema.$ref) as OpenApiSchema | null;
      if (r) resolved = r;
    }

    if (
      resolved.type === "object" &&
      typeof body === "object" &&
      !Array.isArray(body)
    ) {
      const bodyObj = body as Record<string, unknown>;
      const requiredFields = resolved.required ?? [];

      for (const field of requiredFields) {
        if (!(field in bodyObj)) {
          warnings.push(`Missing required field: ${field}`);
        }
      }

      // Check declared properties exist and validate types recursively
      if (resolved.properties) {
        const declaredKeys = Object.keys(resolved.properties);
        const bodyKeys = Object.keys(bodyObj);
        const matchedKeys = declaredKeys.filter((k) => bodyKeys.includes(k));
        const matchRatio =
          declaredKeys.length > 0
            ? matchedKeys.length / declaredKeys.length
            : 1;

        if (matchRatio < 0.3 && declaredKeys.length > 2) {
          warnings.push(
            `Low schema match: only ${matchedKeys.length}/${declaredKeys.length} declared fields present`,
          );
        }

        // Recursive type checking on matched properties (limit depth)
        if (depth < 3) {
          for (const key of matchedKeys) {
            const propSchema = resolved.properties![key];
            const propValue = bodyObj[key];
            if (propValue !== null && propValue !== undefined && propSchema) {
              const propWarnings = this.validateResponseSchema(
                spec,
                propValue,
                propSchema,
                depth + 1,
              );
              for (const w of propWarnings) {
                warnings.push(`${key}.${w}`);
              }
            }
          }
        }
      }
    }

    if (resolved.type === "array" && Array.isArray(body)) {
      // Check items schema on first element
      if (body.length > 0 && resolved.items && depth < 3) {
        const itemWarnings = this.validateResponseSchema(
          spec,
          body[0],
          resolved.items,
          depth + 1,
        );
        for (const w of itemWarnings) {
          warnings.push(`[0]: ${w}`);
        }
      }
    }

    // Type mismatch
    if (
      resolved.type === "object" &&
      (typeof body !== "object" || Array.isArray(body))
    ) {
      warnings.push(
        `Type mismatch: expected object, got ${Array.isArray(body) ? "array" : typeof body}`,
      );
    }
    if (resolved.type === "array" && !Array.isArray(body)) {
      warnings.push(`Type mismatch: expected array, got ${typeof body}`);
    }

    return warnings;
  }

  // ── Scoring ───────────────────────────────────────────────

  private computeScore(results: ContractTestResult[]): number {
    // Exclude skipped endpoints (path parameters) from scoring
    const scoreable = results.filter((r) => !r.skipped);
    if (scoreable.length === 0) return 0;

    const total = scoreable.length;

    // 1. Status code score (40%) — 2xx success or expected 4xx (400/401/403 etc.)
    //    "passed" already incorporates validateStatusCode(), so use it directly
    const statusOk = scoreable.filter((r) => r.passed).length;
    const statusScore = Math.round((statusOk / total) * 100);

    // 2. Schema match score (60%) — responses match declared schema
    const withWarnings = scoreable.filter(
      (r) => r.responseWarnings.length > 0,
    ).length;
    const warningRatio = withWarnings / total;
    const schemaScore = Math.round(100 * (1 - warningRatio));

    // C-3: Response time removed from scoring (reference metrics only)

    return Math.round(
      schemaScore * SCHEMA_MATCH_RATIO + statusScore * STATUS_CODE_RATIO,
    );
  }

  // ── Helpers ───────────────────────────────────────────────

  private emptyResult(reason: string, startTime: number): PhaseResult {
    return {
      phase: "goldenSet",
      passed: true,
      score: 0,
      maxScore: 100,
      weightedScore: 0,
      issues: [
        createIssue({
          severity: "suggestion",
          category: "runtime",
          code: "CT000",
          message: `Contract test skipped: ${reason}`,
        }),
      ],
      durationMs: Math.round(performance.now() - startTime),
      metrics: { contractEndpoints: 0 },
    };
  }
}
