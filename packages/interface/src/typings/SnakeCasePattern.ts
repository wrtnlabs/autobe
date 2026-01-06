import { tags } from "typia";

/**
 * Type pattern enforcing snake_case naming convention.
 *
 * Must start with lowercase letter, followed by lowercase letters, digits, and
 * underscores. Used for database table and column names.
 *
 * Examples: `"user_profile"`, `"shopping_cart_item"`, `"created_at"`
 *
 * @author Samchon
 */
export type SnakeCasePattern = tags.Pattern<"^[a-z][a-z0-9_]*$">;
