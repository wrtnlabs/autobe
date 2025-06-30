import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";

export namespace AutoBeTest {
  export interface IFunction {
    statements: IStatement[];
  }

  /* -----------------------------------------------------------
    STATEMENTS
  ----------------------------------------------------------- */
  export type IStatement =
    | IBlockStatement
    | IExpressionStatement
    | IIfStatement
    | IVariableDeclaration
    | IReturnStatement
    | IThrowStatement;
  export interface IBlockStatement extends IStatementBase<"blockStatement"> {
    statements: IStatement[];
  }
  export interface IExpressionStatement
    extends IStatementBase<"expressionStatement"> {
    expression: IExpression;
  }
  export interface IIfStatement extends IStatementBase<"ifStatement"> {
    condition: IExpression;
    thenStatement: IBlockStatement;
    elseStatement: IBlockStatement | IIfStatement | null;
  }
  export interface IVariableDeclaration
    extends IStatementBase<"variableDeclaration"> {
    name: string;
    schema: AutoBeOpenApi.IJsonSchema;
    mutability: "const" | "let";
  }
  export interface IReturnStatement extends IStatementBase<"returnStatement"> {
    value: IExpression;
  }
  export interface IThrowStatement extends IStatementBase<"throwStatement"> {
    expression: IExpression;
  }

  /** @ignore */
  interface IStatementBase<Type extends string> {
    type: Type;
  }

  /* ===========================================================
    EXPRESSIONS
      - BASIC
      - ACCESSORS
      - FUNCTIONAL
      - LITERALS
      - RANDOM
  ==============================================================
    BASIC
  ----------------------------------------------------------- */
  export type IExpression =
    | IIdentifier
    | IPropertyAccessExpression
    | IElementAccessExpression
    | IArrowFunction
    | ICallExpression
    | INewExpression
    | IPrefixUnaryExpression
    | IPostfixUnaryExpression
    | IBinaryExpression
    | IBooleanLiteral
    | INumericLiteral
    | IStringLiteral
    | IArrayLiteral
    | IObjectLiteral
    | INullLiteral
    | IUndefinedKeyword
    | IArrayRandom
    | IPickRandom
    | ISampleRandom
    | IBooleanRandom
    | IIntegerRandom
    | INumberRandom
    | IStringRandom
    | IPatternRandom
    | IFormatRandom
    | IDomainRandom;

  /** @ignore */
  interface IExpressionBase<Type extends string> {
    type: Type;
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  export interface IIdentifier extends IExpressionBase<"identifier"> {
    text: string;
  }

  export interface IPropertyAccessExpression
    extends IExpressionBase<"propertyAccessExpression"> {
    expression: IExpression;
    questionDot: boolean;
    name: string;
  }

  export interface IElementAccessExpression
    extends IExpressionBase<"elementAccessExpression"> {
    expression: IExpression;
    questionDot: boolean;
    argumentExpression: IExpression;
  }

  /* -----------------------------------------------------------
    FUNCTIONAL
  ----------------------------------------------------------- */
  export interface IArrowFunction extends IExpressionBase<"arrowFunction"> {
    body: IBlockStatement;
  }

  export interface ICallExpression extends IExpressionBase<"callExpression"> {
    expression: IExpression;
    arguments: IExpression[];
  }

  export interface INewExpression extends IExpressionBase<"newExpression"> {
    expression: IExpression;
    arguments: IExpression[];
  }

  export interface IConditionalExpression
    extends IExpressionBase<"conditionalExpression"> {
    condition: IExpression;
    whenTrue: IExpression;
    whenFalse: IExpression;
  }

  export interface IPrefixUnaryExpression
    extends IExpressionBase<"prefixUnaryExpression"> {
    operator: "!" | "++" | "--";
    operand: IExpression;
  }

  export interface IPostfixUnaryExpression
    extends IExpressionBase<"postfixUnaryExpression"> {
    operator: "++" | "--";
    operand: IExpression;
  }

  export interface IBinaryExpression
    extends IExpressionBase<"binaryExpression"> {
    left: IExpression;
    operator:
      | "==="
      | "!=="
      | "<"
      | "<="
      | ">"
      | ">="
      | "+"
      | "-"
      | "*"
      | "/"
      | "%"
      | "&&"
      | "||";
    right: IExpression;
  }

  /* -----------------------------------------------------------
    LITERALS
  ----------------------------------------------------------- */
  export interface IBooleanLiteral extends IExpressionBase<"booleanLiteral"> {
    value: boolean;
  }
  export interface INumericLiteral extends IExpressionBase<"numericLiteral"> {
    value: number;
  }
  export interface IStringLiteral extends IExpressionBase<"stringLiteral"> {
    value: string;
  }
  export interface IArrayLiteral extends IExpressionBase<"arrayLiteral"> {
    elements: IExpression[];
  }
  export interface IObjectLiteral extends IExpressionBase<"objectLiteral"> {
    properties: IPropertyAssignment[];
  }
  export interface INullLiteral extends IExpressionBase<"nullLiteral"> {
    value: null;
  }
  export interface IUndefinedKeyword
    extends IExpressionBase<"undefinedKeyword"> {
    value: undefined;
  }

  /* -----------------------------------------------------------
    RANDOM
  ----------------------------------------------------------- */
  export interface IArrayRandom extends IExpressionBase<"arrayRandom"> {
    length: IExpression;
    generate: IArrowFunction;
  }

  export interface IPickRandom extends IExpressionBase<"pickRandom"> {
    expression: IExpression;
  }

  export interface ISampleRandom extends IExpressionBase<"sampleRandom"> {
    expression: IExpression;
    count: number;
  }

  export interface IBooleanRandom extends IExpressionBase<"booleanRandom"> {
    probability: number | null;
  }

  export interface IIntegerRandom extends IExpressionBase<"integerRandom"> {
    minimum: number | null;
    maximum: number | null;
    multipleOf: number | null;
  }

  export interface INumberRandom extends IExpressionBase<"numberRandom"> {
    minimum: number | null;
    maximum: number | null;
    multipleOf: number | null;
  }

  export interface IStringRandom extends IExpressionBase<"stringRandom"> {
    minLength: number | null;
    maxLength: number | null;
  }

  export interface IPatternRandom extends IExpressionBase<"patternRandom"> {
    pattern: string;
  }

  export interface IFormatRandom extends IExpressionBase<"formatRandom"> {
    format:
      | "binary"
      | "byte"
      | "password"
      | "regex"
      | "uuid"
      | "email"
      | "hostname"
      | "idn-email"
      | "idn-hostname"
      | "iri"
      | "iri-reference"
      | "ipv4"
      | "ipv6"
      | "uri"
      | "uri-reference"
      | "uri-template"
      | "url"
      | "date-time"
      | "date"
      | "time"
      | "duration"
      | "json-pointer"
      | "relative-json-pointer";
  }

  export interface IDomainRandom extends IExpressionBase<"domainRandom"> {
    keyword:
      | "alphabets"
      | "alphaNumeric"
      | "paragraph"
      | "content"
      | "mobile"
      | "name";
  }

  /* -----------------------------------------------------------
    INTERNALS
  ----------------------------------------------------------- */
  export interface IPropertyAssignment {
    type: "propertyAssignment";
    name: string;
    value: IExpression;
  }
}
