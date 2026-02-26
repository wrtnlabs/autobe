import { AgenticaValidateEvent } from "@agentica/core";

import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { stringifyValidationFailure } from "../utils/stringifyValidationFailure";

export const getValidationErrorPrompt = (
  events: AgenticaValidateEvent[],
): string => {
  if (events.length < 2) return AutoBeSystemPromptConstant.AGENTICA_VALIDATE;

  const previous: AgenticaValidateEvent[] = events.slice(0, -1).slice(-2);
  return [
    AutoBeSystemPromptConstant.AGENTICA_VALIDATE,
    AutoBeSystemPromptConstant.AGENTICA_VALIDATE_REPEATED.replace(
      "${{HISTORICAL_ERRORS}}",
      previous
        .map((ve, i) =>
          [
            `### ${i + 1}. Previous Validation Error`,
            "",
            summarizeValidationFailure(ve.result),
            "",
            stringifyValidationFailure({
              ...ve.result,
              errors: ve.result.errors.slice(0, 8),
            }),
          ].join("\n"),
        )
        .join("\n\n"),
    ),
  ].join("\n\n");
};

const summarizeValidationFailure = (
  failure: AgenticaValidateEvent["result"],
): string => {
  const grouped = new Map<
    string,
    { count: number; expected: string; sampleValue: string }
  >();
  for (const error of failure.errors) {
    const key = `${error.path}::${error.expected}`;
    const prev = grouped.get(key);
    const sampleValue = JSON.stringify(error.value)?.slice(0, 160) ?? "null";
    if (prev) prev.count++;
    else
      grouped.set(key, {
        count: 1,
        expected: error.expected,
        sampleValue,
      });
  }

  const entries = [...grouped.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);
  return [
    `Validation summary: ${failure.errors.length} error(s) across ${grouped.size} group(s)`,
    ...entries.map(([key, value]) => {
      const path = key.slice(0, key.indexOf("::"));
      return `- ${path} (${value.count}x) expected: ${value.expected}; sample: ${value.sampleValue}`;
    }),
    grouped.size > entries.length
      ? `- ... ${grouped.size - entries.length} more grouped path(s)`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
};
