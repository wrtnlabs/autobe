import { consentFunctionCall } from "@autobe/agent/src/factory/consentFunctionCall";
import { TestValidator } from "@nestia/e2e";
import OpenAI from "openai";

import { TestGlobal } from "../../TestGlobal";

export const test_agent_consent_function_call = async () => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  const consent = (message: string) =>
    consentFunctionCall({
      source: "analyzeWrite",
      dispatch: () => {},
      config: {},
      vendor: {
        api: new OpenAI({
          apiKey: TestGlobal.env.API_KEY,
          baseURL: TestGlobal.env.BASE_URL,
        }),
        model:
          TestGlobal.getArguments("vendor")?.[0] ??
          TestGlobal.env.VENDOR_MODEL ??
          "gpt-4.1",
        semaphore: Number(TestGlobal.getArguments("semaphore")?.[0] ?? "16"),
      },
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
