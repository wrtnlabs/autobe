import { compileMdx } from "nextra/compile";
import { MDXRemote } from "nextra/mdx-remote";

export async function AutoBeAgentVendorSnippet(
  props: AutoBeAgentVendorSnippet.IProps,
) {
  const raw = await compileMdx(getContent(props));
  return <MDXRemote compiledSource={raw} />;
}
export namespace AutoBeAgentVendorSnippet {
  export interface IProps {
    title: string;
    vendor: string;
    schema: string;
  }
}
export default AutoBeAgentVendorSnippet;

function getContent(props: AutoBeAgentVendorSnippet.IProps): string {
  return `\`\`\`typescript filename="src/main.${props.title}.ts" showLineNumbers {6-13}
import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import OpenAI from "openai";

const agent = new AutoBeAgent({
  model: "${props.schema}",
  vendor: {
    api: new OpenAI({
      apiKey: "********",
      baseURL: "https://openrouter.ai/api/v1",
    }),
    model: "${props.vendor}",
  },
  compiler: new AutoBeCompiler(),
});
await agent.conversate(\`
  I want to create a political/economic discussion board.
  
  Since I'm not familiar with programming, 
  please write a requirements analysis report as you see fit.
\`);
\`\`\``;
}
