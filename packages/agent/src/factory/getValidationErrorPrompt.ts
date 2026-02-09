import { AgenticaValidateEvent } from "@agentica/core";

import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { stringifyValidateFailure } from "../utils/stringifyValidationError";

export const getValidationErrorPrompt = (
  events: AgenticaValidateEvent[],
): string => {
  if (events.length < 2) return AutoBeSystemPromptConstant.AGENTICA_VALIDATE;

  const previous: AgenticaValidateEvent[] = events.slice(0, -1);
  return [
    AutoBeSystemPromptConstant.AGENTICA_VALIDATE,
    AutoBeSystemPromptConstant.AGENTICA_VALIDATE_REPEATED.replace(
      "${{HISTORICAL_ERRORS}}",
      previous
        .map((ve, i) =>
          [
            `### ${i + 1}. Previous Validation Error`,
            "",
            stringifyValidateFailure(ve.result),
          ].join("\n"),
        )
        .join("\n\n"),
    ),
  ].join("\n\n");
};
