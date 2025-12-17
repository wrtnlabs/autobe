import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

/**
 * Validates that AI-generated code contains the expected function name.
 *
 * Detects two common AI failure modes: (1) returning empty code snippets
 * instead of actual implementations, and (2) hallucinating different function
 * names than requested. By checking function name presence early, this prevents
 * wasting compiler resources on obviously broken code and provides clearer
 * error messages to the correction orchestrator.
 *
 * Used extensively in Test and Realize phases where AI generates test functions
 * and API operation implementations. Without this validation, empty or misnamed
 * functions would pass to TypeScript compiler, generating confusing "not found"
 * errors instead of actionable "you forgot to write the function" feedback.
 *
 * @param props Function name to validate and code strings to check
 * @returns Array of validation errors (empty if valid)
 */
export const validateEmptyCode = (props: {
  path: string;
  functionName: string;
  draft: string;
  revise: {
    final: string | null;
  };
}): IValidation.IError[] => {
  const errors: IValidation.IError[] = [];
  if (props.draft.includes(props.functionName) === false)
    errors.push({
      path: `${props.path}.draft`,
      expected: `string (including function named '${props.functionName}')`,
      value: props.draft,
      description: description(props.functionName),
    });
  if (
    props.revise.final !== null &&
    props.revise.final.includes(props.functionName) === false
  )
    errors.push({
      path: `${props.path}.revise.final`,
      expected: `string (including function named '${props.functionName}')`,
      value: props.revise.final,
      description: description(props.functionName),
    });
  return errors;
};

/** Generates detailed error description for missing function. */
const description = (func: string): string => StringUtil.trim`
  The function ${func} does not exist in the provided code snippet.

  The first reason of the non-existence is that the code snippet is empty,
  and the second reason is that AI has written different function name
  by mistake.

  Please make sure that the code snippet includes the function ${func}.
  Note that, you never have to write empty code or different function name.
`;
