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
  asynchronous: boolean;
  name: string;
  draft: string;
  revise: {
    final: string | null;
  };
}): IValidation.IError[] => {
  const errors: IValidation.IError[] = [];
  const declaration: string = props.asynchronous === true
    ? `export async function ${props.name}(`
    : `export function ${props.name}(`;

  if (props.draft.includes(declaration) === false)
    errors.push({
      path: `${props.path}.draft`,
      expected: `string (including function declaration starting with '${props.name}')`,
      value: props.draft,
      description: description(declaration),
    });
  if (
    props.revise.final !== null &&
    props.revise.final.includes(declaration) === false
  )
    errors.push({
      path: `${props.path}.revise.final`,
      expected: `string (including function declaration starting with '${props.name}')`,
      value: props.revise.final,
      description: description(declaration),
    });
  return errors;
};

/** Generates detailed error description for missing function. */
const description = (declaration: string): string => StringUtil.trim`
  \`\`\`
  ${declaration}
  \`\`\`

  The above function declaration does not exist in the provided code snippet.
  You have to declare the function exactly starting with the above line.

  The first reason of the non-existence is that the code snippet is empty,
  and the second reason is that AI has written different function name
  by mistake.

  Please make sure that the code snippet includes the function "${declaration}".
  
  Note that, you never have to write empty code or different function name.
  This is not a recommendation, but an instruction you must obey.
`;
