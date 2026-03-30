import * as fs from "fs";
import * as path from "path";

/**
 * Validates API responses against OpenAPI spec schemas. Checks that response
 * bodies contain expected fields defined in the spec.
 */

interface OpenApiSchema {
  type?: string;
  properties?: Record<string, unknown>;
  items?: OpenApiSchema;
  $ref?: string;
  required?: string[];
}

interface OpenApiPathOp {
  responses?: Record<
    string,
    {
      content?: Record<string, { schema?: OpenApiSchema }>;
    }
  >;
}

/** Validation result for a single response */
export interface ResponseValidation {
  valid: boolean;
  warnings: string[];
}

/** Load and parse OpenAPI spec from project */
export function loadOpenApiSpec(
  rootPath: string,
): Record<string, unknown> | null {
  const candidates = [
    path.join(rootPath, "swagger.json"),
    path.join(rootPath, "openapi.json"),
    path.join(rootPath, "docs", "swagger.json"),
    path.join(rootPath, "docs", "openapi.json"),
    path.join(rootPath, "output", "swagger.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return JSON.parse(fs.readFileSync(candidate, "utf-8"));
      } catch {
        continue;
      }
    }
  }

  return null;
}

/** Resolve $ref to schema definition */
export function resolveRef(
  spec: Record<string, unknown>,
  ref: string,
): OpenApiSchema | null {
  // Handle "#/components/schemas/Foo" format
  const parts = ref.replace(/^#\//, "").split("/");
  let current: unknown = spec;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return null;
    current = (current as Record<string, unknown>)[part];
  }
  return (current as OpenApiSchema) || null;
}

/** Get expected response schema for a path+method from spec */
export function getResponseSchema(
  spec: Record<string, unknown>,
  apiPath: string,
  method: string,
): OpenApiSchema | null {
  const paths = spec.paths as Record<string, Record<string, OpenApiPathOp>>;
  if (!paths) return null;

  // Try exact match first, then parameter-substituted match
  const pathObj = paths[apiPath];
  if (!pathObj) return null;

  const op = pathObj[method.toLowerCase()];
  if (!op?.responses) return null;

  // Check 200, 201, 2xx responses
  const successCodes = ["200", "201", "2XX", "default"];
  for (const code of successCodes) {
    const response = op.responses[code];
    if (!response?.content) continue;
    const jsonContent =
      response.content["application/json"] || response.content["*/*"];
    if (jsonContent?.schema) {
      let schema = jsonContent.schema;
      if (schema.$ref) {
        schema = resolveRef(spec, schema.$ref) || schema;
      }
      return schema;
    }
  }

  return null;
}

/** Validate a response body against expected schema fields */
export function validateResponse(
  body: unknown,
  expectedFields?: string[],
): ResponseValidation {
  const warnings: string[] = [];

  if (!body || typeof body !== "object") {
    return { valid: true, warnings };
  }

  if (expectedFields && expectedFields.length > 0) {
    const bodyKeys = Object.keys(body as Record<string, unknown>);
    for (const field of expectedFields) {
      if (!bodyKeys.includes(field)) {
        warnings.push(`Missing expected field: ${field}`);
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}

/**
 * Validate that a response body has reasonable structure. Checks for common
 * patterns: arrays should have elements with consistent keys, objects should
 * have non-null values for key fields.
 */
export function validateResponseStructure(
  body: unknown,
  context: string,
): string[] {
  const warnings: string[] = [];

  if (body === null || body === undefined) {
    warnings.push(`${context}: response body is null/undefined`);
    return warnings;
  }

  // Array response — check elements have consistent keys
  if (Array.isArray(body)) {
    if (body.length > 0 && typeof body[0] === "object" && body[0] !== null) {
      const firstKeys = Object.keys(body[0]);
      if (firstKeys.length === 0) {
        warnings.push(`${context}: array elements are empty objects`);
      }
      // Check that id field exists in each element (common pattern)
      const hasIds = body.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          ("id" in item || "ID" in item),
      );
      if (!hasIds && body.length > 1) {
        warnings.push(`${context}: array elements missing 'id' field`);
      }
    }
    return warnings;
  }

  // Object response — check for empty objects
  if (typeof body === "object") {
    const keys = Object.keys(body);
    if (keys.length === 0) {
      warnings.push(`${context}: response is empty object {}`);
    }
  }

  return warnings;
}

/**
 * Validate data consistency between create and read operations. Checks that
 * fields sent in create request appear in subsequent read.
 */
export function validateDataConsistency(
  sentData: Record<string, unknown>,
  receivedData: Record<string, unknown>,
  fieldsToCheck: string[],
): string[] {
  const warnings: string[] = [];

  for (const field of fieldsToCheck) {
    if (field in sentData && field in receivedData) {
      const sent = sentData[field];
      const received = receivedData[field];
      if (
        sent !== received &&
        JSON.stringify(sent) !== JSON.stringify(received)
      ) {
        warnings.push(
          `Data mismatch for '${field}': sent=${JSON.stringify(sent)}, received=${JSON.stringify(received)}`,
        );
      }
    } else if (field in sentData && !(field in receivedData)) {
      warnings.push(`Field '${field}' was sent but not in response`);
    }
  }

  return warnings;
}
