// @ts-check
"use strict";

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow inline object types in interface/type alias properties. Extract them as named types.",
    },
    messages: {
      noInlineObjectType:
        "Inline object type found in '{{ propName }}'. Extract it as a named type (e.g. type {{ suggested }} = { ... }).",
    },
    schema: [],
  },

  create(context) {
    function checkTypeAnnotation(typeAnnotation, propName) {
      if (typeAnnotation?.type === "TSTypeLiteral") {
        const suggested = propName
          ? propName.charAt(0).toUpperCase() + propName.slice(1)
          : "ExtractedType";
        context.report({
          node: typeAnnotation,
          messageId: "noInlineObjectType",
          data: { propName, suggested },
        });
      }
    }

    return {
      // interface Foo { bar: { ... } }
      TSPropertySignature(node) {
        const propName =
          node.key?.type === "Identifier" ? node.key.name : "<unknown>";
        checkTypeAnnotation(node.typeAnnotation?.typeAnnotation, propName);
      },

      // type Foo = { bar: { ... } }
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation?.type === "TSTypeLiteral") {
          for (const member of node.typeAnnotation.members) {
            if (member.type === "TSPropertySignature") {
              const propName =
                member.key?.type === "Identifier"
                  ? member.key.name
                  : "<unknown>";
              checkTypeAnnotation(
                member.typeAnnotation?.typeAnnotation,
                propName,
              );
            }
          }
        }
      },
    };
  },
};

module.exports = rule;
