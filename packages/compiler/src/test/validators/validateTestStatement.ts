import { AutoBeTest } from "@autobe/interface";

import { AutoBeTestStatementValidator } from "./AutoBeTestStatementValidator";
import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";

export const validateTestStatement = (
  ctx: IAutoBeTextValidateContext,
  item: AutoBeTest.IStatement,
  path: string,
): void => AutoBeTestStatementValidator[item.type](ctx, item as any, path);
