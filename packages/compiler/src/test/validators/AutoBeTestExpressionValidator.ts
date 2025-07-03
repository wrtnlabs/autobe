import { AutoBeTest } from "@autobe/interface";

import { AutoBeTestStatementValidator } from "./AutoBeTestStatementValidator";
import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";
import { validateTestExpression } from "./validateTestExpression";

export namespace AutoBeTestExpressionValidator {
  /* -----------------------------------------------------------
    LITERALS
  ----------------------------------------------------------- */
  export const booleanLiteral = (): void => {};
  export const numericLiteral = (): void => {};
  export const stringLiteral = (): void => {};
  export const nullLiteral = (): void => {};
  export const undefinedKeyword = (): void => {};

  export const arrayLiteralExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IArrayLiteralExpression,
    path: string,
  ): void => {
    item.elements.forEach((element, i) => {
      validateTestExpression(ctx, element, `${path}.elements[${i}]`);
    });
  };

  export const objectLiteralExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IObjectLiteralExpression,
    path: string,
  ): void => {
    item.properties.forEach((property, i) => {
      validateTestExpression(ctx, property.value, `${path}.properties[${i}]`);
    });
  };

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  export const identifier = (): void => {};

  export const propertyAccessExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IPropertyAccessExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
  };

  export const elementAccessExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IElementAccessExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
    validateTestExpression(
      ctx,
      item.argumentExpression,
      `${path}.argumentExpression`,
    );
  };

  /* -----------------------------------------------------------
    OPERATORS
  ----------------------------------------------------------- */
  export const prefixUnaryExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IPrefixUnaryExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.operand, `${path}.operand`);
  };

  export const postfixUnaryExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IPostfixUnaryExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.operand, `${path}.operand`);
  };

  export const binaryExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IBinaryExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.left, `${path}.left`);
    validateTestExpression(ctx, item.right, `${path}.right`);
  };

  export const conditionalExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IConditionalExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.condition, `${path}.condition`);
    validateTestExpression(ctx, item.whenTrue, `${path}.whenTrue`);
    validateTestExpression(ctx, item.whenFalse, `${path}.whenFalse`);
  };

  /* -----------------------------------------------------------
    FUNCTIONAL
  ----------------------------------------------------------- */
  export const arrowFunction = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IArrowFunction,
    path: string,
  ): void => {
    AutoBeTestStatementValidator.block(ctx, item.body, `${path}.body`);
  };

  export const callExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.ICallExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
    item.arguments.forEach((arg, i) => {
      validateTestExpression(ctx, arg, `${path}.arguments[${i}]`);
    });
  };

  export const newExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.INewExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
    item.arguments.forEach((arg, i) => {
      validateTestExpression(ctx, arg, `${path}.arguments[${i}]`);
    });
  };

  export const arrayFilterExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IArrayFilterExpression,
    path: string,
  ): void => arrayClosureExpression(ctx, item, path);

  export const arrayForEachExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IArrayForEachExpression,
    path: string,
  ): void => arrayClosureExpression(ctx, item, path);

  export const arrayMapExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IArrayMapExpression,
    path: string,
  ): void => arrayClosureExpression(ctx, item, path);

  export const arrayRepeatExpression = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IArrayRepeatExpression,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.length, `${path}.length`);
    arrowFunction(ctx, item.function, `${path}.function`);
  };

  const arrayClosureExpression = (
    ctx: IAutoBeTextValidateContext,
    item: {
      expression: AutoBeTest.IExpression;
      function: AutoBeTest.IArrowFunction;
    },
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
    arrowFunction(ctx, item.function, `${path}.function`);
  };

  /* -----------------------------------------------------------
    RANDOM GENERATORS
  ----------------------------------------------------------- */
  export const pickRandom = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IPickRandom,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
  };

  export const sampleRandom = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.ISampleRandom,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
    validateTestExpression(ctx, item.length, `${path}.length`);
  };

  export const booleanRandom = (): void => {};
  export const integerRandom = (): void => {};
  export const numberRandom = (): void => {};
  export const stringRandom = (): void => {};
  export const patternRandom = (): void => {};
  export const formatRandom = (): void => {};
  export const keywordRandom = (): void => {};

  /* -----------------------------------------------------------
    PREDICATORS
  ----------------------------------------------------------- */
  export const equalPredicate = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IEqualPredicate,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.x, `${path}.x`);
    validateTestExpression(ctx, item.y, `${path}.y`);
  };

  export const notEqualPredicate = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.INotEqualPredicate,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.x, `${path}.x`);
    validateTestExpression(ctx, item.y, `${path}.y`);
  };

  export const conditionalPredicate = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IConditionalPredicate,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.condition`);
  };

  export const errorPredicate = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IErrorPredicate,
    path: string,
  ): void => {
    arrowFunction(ctx, item.function, `${path}.function`);
  };
}
