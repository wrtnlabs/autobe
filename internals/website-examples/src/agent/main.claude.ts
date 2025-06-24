import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import OpenAI from "openai";

const agent = new AutoBeAgent({
  model: "claude",
  vendor: {
    api: new OpenAI({
      apiKey: "********",
      baseURL: "https://openrouter.ai/api/v1",
    }),
    model: "anthropic/claude-3.5-sonnet",
  },
  compiler: new AutoBeCompiler(),
});
await agent.conversate(`
  I want to create a political/economic discussion board.
  
  Since I'm not familiar with programming, 
  please write a requirements analysis report as you see fit.
`);
