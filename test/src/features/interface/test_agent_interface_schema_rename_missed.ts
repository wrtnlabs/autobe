import { AutoBeOpenApi } from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import afterJson from "./rename/after.json";
import beforeJson from "./rename/before.json";
import finalizeJson from "./rename/finalize.json";

export const test_agent_interface_schema_rename_missed = (): void => {
  const before = typia.assert<AutoBeOpenApi.IDocument>(beforeJson);
  const after = typia.assert<AutoBeOpenApi.IDocument>(afterJson);
  const finalize = typia.assert<AutoBeOpenApi.IDocument>(finalizeJson);

  TestValidator.equals("before", missedOpenApiSchemas(before), []);
  TestValidator.equals("after", missedOpenApiSchemas(after), []);
  TestValidator.equals("finalize", missedOpenApiSchemas(finalize), []);
};
