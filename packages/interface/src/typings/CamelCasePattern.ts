import { tags } from "typia";

/**
 * Type pattern enforcing camelCase naming convention.
 *
 * Must start with lowercase letter, followed by letters and digits.
 * Used for TypeScript variable, function, and property names.
 *
 * Examples: `"userProfile"`, `"createdAt"`, `"httpResponse"`
 *
 * @author Samchon
 */
export type CamelCasePattern = tags.Pattern<"^[a-z][a-zA-Z0-9]*$">;
