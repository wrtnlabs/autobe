import { AutoBeTest } from "@autobe/interface";

import { AutoBeTestExpressionValidator } from "./AutoBeTestExpressionValidator";
import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";

export const validateTestExpression = (
  ctx: IAutoBeTextValidateContext,
  item: AutoBeTest.IExpression,
  path: string,
): void => AutoBeTestExpressionValidator[item.type](ctx, item as any, path);
