import { compileMdx } from "nextra/compile";
import { Mermaid } from "nextra/components";
import { MDXRemote } from "nextra/mdx-remote";

import { getLocalSourceFile } from "./internal/getLocalSourceFile";

export const AutoBeRoadmapDiagram = async () => {
  const content: string = [
    "```mermaid",
    (await getLocalSourceFile("README.md"))
      .split("## Roadmap Schedule")[1]
      .split("```mermaid")[1]
      .split("```")[0]
      .trim(),
    "```",
  ].join("\n");
  const raw: string = await compileMdx(content);
  return <MDXRemote compiledSource={raw} components={{ Mermaid }} />;
};
export default AutoBeRoadmapDiagram;
