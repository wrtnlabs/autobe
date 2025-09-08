import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia/lib/module";
import { v7 } from "uuid";

function getValue() {
  return 3;
}
function getNullableUserId() {
  return v7();
}
function getUnknownValue(): unknown {
  return 3;
}

// Solution 1: Basic type
const page: number & tags.Type<"int32"> = getValue();
const pageWithMinimum: number & tags.Type<"int32"> & tags.Minimum<0> =
  getValue();
TestValidator.equals("page", pageWithMinimum, page satisfies number as number);

// Solution 2: Nullable type mismatch
const userIdOptional: (string & tags.Format<"uuid">) | null | undefined =
  getNullableUserId();
const userIdOptionalByOtherWay:
  | (string & tags.Pattern<"<SOME-UUID-PATTERN>">)
  | null
  | undefined = getNullableUserId();
TestValidator.equals(
  "id",
  userIdOptionalByOtherWay,
  userIdOptional satisfies string | null | undefined as
    | string
    | null
    | undefined,
);

// Solution: Nullable to non-nullable
const uuidOptional: (string & tags.Format<"uuid">) | null | undefined =
  getNullableUserId();
const uuidRequired: string & tags.Pattern<"<SOME-UUID-PATTERN>"> = typia.assert(
  (uuidOptional satisfies string | null | undefined as
    | string
    | null
    | undefined)!,
);
TestValidator.equals(
  "uuid-nullable-to-non-nullable",
  uuidRequired,
  typia.assert(
    (uuidOptional satisfies string | null | undefined as
      | string
      | null
      | undefined)!,
  ),
);

// Don't know how to or previous trial failed?
// Just use typia.assert<T>(value) for simplicity
const someValue: unknown = getUnknownValue();
const simple: number & tags.Type<"int32"> & tags.Minimum<0> = typia.assert<
  number & tags.Type<"int32"> & tags.Minimum<0>
>(someValue);
simple;
