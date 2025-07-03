import { IValidation } from "typia";

import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";
import { validateTestStatement } from "./validateTestStatement";

export const validateTestFunction = (
  ctx: IAutoBeTextValidateContext,
): IValidation.IError[] | null => {
  const errors: IValidation.IError[] = [];
  ctx.function.statements.forEach((stmt, i) =>
    validateTestStatement(ctx, stmt, `$input.function.statements[${i}]`),
  );
  return errors.length ? errors : null;
};
