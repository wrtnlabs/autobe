import { compileMdx } from "nextra/compile";
import { MDXRemote } from "nextra/mdx-remote";

import { getLocalSourceFile } from "./internal/getLocalSourceFile";

export const LocalSourceGroup = async (props: {
  paths: string[];
  filename?: string;
  showLineNumbers?: boolean;
  highlight?: string;
}) => {
  const contents: string[] = await Promise.all(
    props.paths.map(getLocalSourceFile),
  );
  const header: string = [
    `${BRACKET}typescript`,
    !!props.filename?.length
      ? ` filename=${JSON.stringify(props.filename)}`
      : "",
    props.showLineNumbers ? " showLineNumbers" : "",
    !!props.highlight?.length ? ` {${props.highlight}}` : "",
  ].join("");
  const raw: string = await compileMdx(
    [
      header,
      contents
        .map((c, i) =>
          [
            "//----------------------------------------",
            "// File: " + props.paths[i].split("/").pop(),
            "//----------------------------------------",
            c.trim(),
          ].join("\n"),
        )
        .join("\n\n"),
      BRACKET,
    ].join("\n"),
  );
  return <MDXRemote compiledSource={raw} />;
};
export default LocalSourceGroup;

const BRACKET = "```";
