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

interface EndpointSpec {
  path: string;
  method: string;
  requestBodySchema?: OpenApiSchema;
  responseSchema?: OpenApiSchema;
  requiresAuth: boolean;
  category: ScenarioCategory;
}

interface ContractTestResult extends ScenarioResult {
  endpoint: string;
  method: string;
  statusCode?: number;
  responseWarnings: string[];
}

// ── Score ratios (same structure as GoldenSetEvaluator) ─────

const SCHEMA_MATCH_RATIO = 0.5; // response matches declared schema
const STATUS_CODE_RATIO = 0.3; // correct HTTP status code
const RESPONSE_TIME_RATIO = 0.2; // reasonable response time

// ── Max endpoints to test (cost/time guard) ─────────────────

const MAX_ENDPOINTS = 80;
const _REQUEST_TIMEOUT_MS = 10000;

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

    // 1. Find auth endpoint and get token
    const authToken = await this.tryAuthenticate(spec, endpoints, http);

    // 2. Test each endpoint
    const toTest = this.selectEndpoints(endpoints);
    console.log(
      `  ${this.name}: testing ${toTest.length}/${endpoints.length} endpoints from spec`,
    );

    for (const ep of toTest) {
      const result = await this.testEndpoint(spec, ep, http, authToken);
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

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const timings = results
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

        endpoints.push({
          path: apiPath,
          method: method.toUpperCase(),
          requestBodySchema: requestBodySchema ?? undefined,
          responseSchema: responseSchema ?? undefined,
          requiresAuth,
          category,
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
        const res = await http.post(joinEp?.path ?? loginEp.path, body);
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
  ): Promise<ContractTestResult> {
    const useToken = ep.requiresAuth && authToken !== null;
    const warnings: string[] = [];

    try {
      let res;
      const path = ep.path;

      // Skip endpoints with path parameters (we can't resolve them)
      if (path.includes("{") || path.includes(":")) {
        return {
          id: 0,
          name: `${ep.method} ${ep.path}`,
          passed: true, // skip, don't penalize
          category: ep.category,
          endpoint: ep.path,
          method: ep.method,
          responseWarnings: [],
          reason: "skipped (path parameters)",
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

  private validateStatusCode(ep: EndpointSpec, status: number): boolean {
    // Auth endpoints returning 400/401 with bad credentials is expected
    if (ep.category === "auth" && (status === 400 || status === 401))
      return true;

    // Server responding at all is a pass for contract testing
    // Status 0 = connection refused
    if (status === 0) return false;

    // 2xx = success
    if (status >= 200 && status < 300) return true;

    // 4xx can be OK for contract testing (validation errors, etc.)
    // The important thing is the server handles it gracefully
    if (status >= 400 && status < 500) return true;

    // 5xx = server error = fail
    return false;
  }

  private isExpectedError(ep: EndpointSpec, status: number): boolean {
    // 4xx errors are expected when we send generated data
    return status >= 400 && status < 500;
  }

  // ── Response schema validation ────────────────────────────

  private validateResponseSchema(
    spec: Record<string, unknown>,
    body: unknown,
    schema: OpenApiSchema,
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

      // Check declared properties exist
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
      }
    }

    if (resolved.type === "array" && Array.isArray(body)) {
      // Check items schema on first element
      if (body.length > 0 && resolved.items) {
        const itemWarnings = this.validateResponseSchema(
          spec,
          body[0],
          resolved.items,
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
    if (results.length === 0) return 0;

    const total = results.length;

    // 1. Status code score (30%) — not 5xx
    const statusOk = results.filter(
      (r) =>
        r.statusCode !== undefined && r.statusCode !== 0 && r.statusCode < 500,
    ).length;
    const statusScore = (statusOk / total) * 100;

    // 2. Schema match score (50%) — responses match declared schema
    const withWarnings = results.filter(
      (r) => r.responseWarnings.length > 0,
    ).length;
    const warningRatio = withWarnings / total;
    const schemaScore = Math.max(0, 100 - warningRatio * 200);

    // 3. Response time score (20%)
    const timings = results
      .map((r) => r.durationMs)
      .filter((d): d is number => d !== undefined);
    let responseTimeScore = 100;
    if (timings.length > 0) {
      const sorted = [...timings].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      if (p95 >= 5000) responseTimeScore = 0;
      else if (p95 >= 2000) responseTimeScore = 30;
      else if (p95 >= 1000) responseTimeScore = 60;
      else if (p95 >= 500) responseTimeScore = 80;
    }

    return Math.round(
      schemaScore * SCHEMA_MATCH_RATIO +
        statusScore * STATUS_CODE_RATIO +
        responseTimeScore * RESPONSE_TIME_RATIO,
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
