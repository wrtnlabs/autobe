import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import OpenAI from "openai";

const agent = new AutoBeAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({
      apiKey: "********",
    }),
    model: "gpt-4.1",
  },
  config: {
    locale: "ko-KR",
    timezone: "Asia/Seoul",
  },
  compiler: new AutoBeCompiler(),
});

await agent.conversate(`
  I want to create a political/economic discussion board.
  
  Since I'm not familiar with programming, 
  please write a requirements analysis report as you see fit.
`);
