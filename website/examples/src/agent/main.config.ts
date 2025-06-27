import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import OpenAI from "openai";

const agent = new AutoBeAgent({
  model: "llama", // JSON schema model
  vendor: {
    // LLM vendor specification
    api: new OpenAI({
      apiKey: "********",
      baseURL: "https://openrouter.ai/api/v1",
    }),
    model: "meta-llama/llama3.3-70b",
  },
  config: {
    // locale and timezone
    locale: "en-US",
    timezone: "America/New_York",
  },
  compiler: new AutoBeCompiler(), // compiler
});

await agent.conversate(`
  I want to create a political/economic discussion board.
  
  Since I'm not familiar with programming, 
  please write a requirements analysis report as you see fit.
`);
