import { tags } from "typia";

/**
 * Transforms a value that is either a Date or a string into an ISO 8601
 * formatted string. If it's already a string, it assumes it's already in ISO
 * format.
 */
export function toISOStringSafe(
  value: Date | (string & tags.Format<"date-time">),
): string & tags.Format<"date-time"> {
  if (value instanceof Date) {
    return value.toISOString() as string & tags.Format<"date-time">;
  }
  return value;
}
