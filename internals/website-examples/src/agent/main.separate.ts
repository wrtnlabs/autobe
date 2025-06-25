import { AutoBeAgent } from "@autobe/agent";
import { IAutoBeCompiler } from "@autobe/interface";
import OpenAI from "openai";
import path from "path";
import { WorkerConnector } from "tgrid";

// connect to worker
const worker: WorkerConnector<null, null, IAutoBeCompiler> =
  new WorkerConnector(null, null, "process");
await worker.connect(`${__dirname}/compiler${path.extname(__filename)}`);

const agent = new AutoBeAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: "********" }),
    model: "gpt-4.1",
  },
  compiler: worker.getDriver(), // compiler from worker
});

await agent.conversate(`
  I want to create a political/economic discussion board.
  
  Since I'm not familiar with programming, 
  please write a requirements analysis report as you see fit.
`);
