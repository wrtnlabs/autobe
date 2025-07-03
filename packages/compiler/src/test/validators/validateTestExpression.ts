import { AutoBeTest } from "@autobe/interface";

import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";

export const validateTestExpression = (
  ctx: IAutoBeTextValidateContext,
  item: AutoBeTest.IExpression,
  path: string,
): void => {
  if (item.type === "binaryExpression") {
    validateTestExpression(ctx, item.left, `${path}.left`);
    validateTestExpression(ctx, item.right, `${path}.right`);
  } else if (item.type === "callExpression") {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
    item.arguments.forEach((arg, i) => {
      validateTestExpression(ctx, arg, `${path}.arguments[${i}]`);
    });
  } else if (item.type === "identifier") {
  } else if (
    item.type === "arrayFilterExpression" ||
    item.type === "arrayMapExpression" ||
    item.type === "arrayForEachExpression"
  ) {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
    validateTestExpression(ctx, item.function, `${path}.function`);
  } else if (item.type === "arrayRepeatExpression") {
    validateTestExpression(ctx, item.length, `${path}.length`);
    validateTestExpression(ctx, item.function, `${path}.function`);
  }
};
