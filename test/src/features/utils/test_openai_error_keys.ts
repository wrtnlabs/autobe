import { OPENAI_API_ERROR_KEYS } from "@autobe/agent/src/constants/OPENAI_API_ERROR_KEYS";
import { TestValidator } from "@nestia/e2e";
import { APIError } from "openai";

export const test_openai_error_keys = (): void => {
  const e: APIError = new APIError(undefined, undefined, undefined, undefined);
  TestValidator.predicate("openai error keys", () =>
    OPENAI_API_ERROR_KEYS.every((key) => e.hasOwnProperty(key)),
  );
};
