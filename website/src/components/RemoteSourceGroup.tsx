import { compileMdx } from "nextra/compile";
import { MDXRemote } from "nextra/mdx-remote";

import { getRemoteSourceFile } from "./internal/getRemoteSourceFile";

export const RemoteSourceGroup = async (props: {
  urls: string[];
  filename?: string;
  showLineNumbers?: boolean;
  highlight?: string;
}) => {
  const contents: string[] = await Promise.all(
    props.urls.map((url) => getRemoteSourceFile(url)),
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
            "// File: " + props.urls[i].split("/").pop(),
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
export default RemoteSourceGroup;

const BRACKET = "```";
