import { consentFunctionCall } from "@autobe/agent/src/factory/consentFunctionCall";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../TestGlobal";

export const test_agent_consent_function_call = async () => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  const consent = (message: string) =>
    consentFunctionCall({
      source: "analyzeWrite",
      dispatch: () => {},
      config: {},
      vendor: TestGlobal.getVendorConfig(),
      assistantMessage: message,
    });
  TestValidator.equals(
    "consent",
    true,
    !!(await consent("Do you want to proceed?")),
  );
  TestValidator.equals(
    "notApplicable",
    false,
    !!(await consent(
      "Not enough information to compose parameters for the function calling.",
    )),
  );
};
