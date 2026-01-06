import { tags } from "typia";

/**
 * Type pattern enforcing PascalCase naming convention.
 *
 * Must start with uppercase letter, followed by letters and digits.
 * Used for TypeScript class, interface, and type names.
 *
 * Examples: `"UserProfile"`, `"ShoppingCartItem"`, `"HTTPResponse"`
 *
 * @author Samchon
 */
export type PascalCasePattern = tags.Pattern<"^[A-Z][a-zA-Z0-9]*$">;
