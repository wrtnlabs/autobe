export namespace AutoBeEscaper {
  export const variable = (str: string): boolean =>
    reserved(str) === false && /^[a-zA-Z_$][a-zA-Z_$0-9]*$/g.test(str);

  export const reserved = (str: string): boolean => KEYWORDS.includes(str);
}

const KEYWORDS = [
  // data types
  "boolean",
  "byte",
  "char",
  "double",
  "float",
  "int",
  "long",
  "short",
  "void",
  // literals
  "false",
  "null",
  "true",
  // variable declarations
  "let",
  "const",
  "var",
  // control flow
  "break",
  "case",
  "continue",
  "default",
  "do",
  "else",
  "for",
  "if",
  "return",
  "switch",
  "while",
  "with",
  // class related
  "class",
  "extends",
  "implements",
  "instanceof",
  "interface",
  "new",
  "package",
  "super",
  "this",
  // function related
  "function",
  // modifiers
  "abstract",
  "final",
  "native",
  "private",
  "protected",
  "public",
  "static",
  "strictfp",
  "synchronized",
  "transient",
  "volatile",
  // exception handling
  "assert",
  "catch",
  "finally",
  "throw",
  "throws",
  "try",
  // module system
  "export",
  "import",
  "module",
  // operators
  "delete",
  "in",
  "typeof",
  // debugging
  "debugger",
  // other
  "enum",
];
