import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

export const validateEmptyCode = (props: {
  functionName: string;
  draft: string;
  revise: {
    final: string | null;
  };
}): IValidation.IError[] => {
  const errors: IValidation.IError[] = [];
  if (props.draft.includes(props.functionName) === false)
    errors.push({
      path: "$input.draft",
      expected: `string (including function named '${props.functionName}')`,
      value: props.draft,
      description: description(props.functionName),
    });
  if (
    props.revise.final !== null &&
    props.revise.final.includes(props.functionName) === false
  )
    errors.push({
      path: "$input.revise.final",
      expected: `string (including function named '${props.functionName}')`,
      value: props.revise.final,
      description: description(props.functionName),
    });
  return errors;
};

const description = (func: string): string => StringUtil.trim`
  The function ${func} does not exist in the provided code snippet.

  The first reason of the non-existence is that the code snippet is empty,
  and the second reason is that AI has written different function name
  by mistake.

  Please make sure that the code snippet includes the function ${func}.
  Note that, you never have to write empty code or different function name.
`;
