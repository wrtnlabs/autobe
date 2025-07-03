import { AutoBeTest } from "@autobe/interface";

import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";
import { validateTestStatement } from "./validateTestStatement";

export const validateTestBlock = (
  ctx: IAutoBeTextValidateContext,
  item: AutoBeTest.IBlock,
  path: string,
): void => {
  item.statements.forEach((stmt, i) =>
    validateTestStatement(ctx, stmt, `${path}.statements[${i}]`),
  );
};
