import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeHistory } from "@autobe/interface";
import OpenAI from "openai";

declare function getHistories(): Promise<AutoBeHistory[]>;
declare function archiveHistories(histories: AutoBeHistory[]): Promise<void>;

const agent = new AutoBeAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: "********" }),
    model: "gpt-4.1",
  },
  compiler: new AutoBeCompiler(),
  histories: await getHistories(),
});
await agent.conversate(`
  I want to create a political/economic discussion board.
  
  Since I'm not familiar with programming, 
  please write a requirements analysis report as you see fit.
`);
await archiveHistories(agent.getHistories());
