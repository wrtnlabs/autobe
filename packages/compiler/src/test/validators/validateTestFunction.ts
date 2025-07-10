import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";
import { validateTestStatement } from "./validateTestStatement";

export const validateTestFunction = (ctx: IAutoBeTextValidateContext): void =>
  ctx.function.statements.forEach((stmt, i) =>
    validateTestStatement(ctx, stmt, `$input.function.statements[${i}]`),
  );
