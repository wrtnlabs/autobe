import { Biome, Distribution } from "@biomejs/js-api";
import ts from "typescript";

export namespace FilePrinter {
  export const description = <Node extends ts.Node>(
    node: Node,
    comment: string,
  ): Node => {
    if (comment.length === 0) return node;
    ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      ["*", ...comment.split("\n").map((str) => ` * ${str}`), ""].join("\n"),
      true,
    );
    return node;
  };

  export const newLine = () =>
    ts.factory.createExpressionStatement(ts.factory.createIdentifier("\n"));

  export const write = (props: {
    statements: ts.Statement[];
    top?: string;
  }): string => {
    const script: string = ts
      .createPrinter({
        newLine: ts.NewLineKind.LineFeed,
      })
      .printFile(
        ts.factory.createSourceFile(
          props.statements,
          ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
          ts.NodeFlags.None,
        ),
      );
    return (props.top ?? "") + script;
  };

  export const beautify = async (script: string): Promise<string> => {
    try {
      const biome = await Biome.create({ distribution: Distribution.BUNDLER });
      const { projectKey } = biome.openProject();
      biome.applyConfiguration(projectKey, {
        formatter: {
          trailingCommas: "all", // "none" | "es5" | "all"
          lineWidth: 80,
          indentWidth: 2,
          semicolons: "always"
        },
        assist: {
          enabled: true,
          actions: {
            source: {
              organizeImports: {
                level: "on",
                options: {
                  identifierOrder: "natural",
                  groups: [
                    [":SIDE_EFFECT:", ":URL:"],
                    [":NODE:", ":BUN:", ":PACKAGE_WITH_PROTOCOL:", ":PACKAGE:"],
                    "../**",
                    "./**",
                    ["./", "./index", "./index.*"],
                  ],
                },
              },
            },
          },
        },
      });
      const formatted = await biome.formatContent(projectKey, script, {
        filePath: "index.js",
      });
      return formatted.content;
    } catch {
      return script;
    }
  };
}
