import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import { ILlmSchema } from "@samchon/openapi";
import { OpenAI } from "openai";
import { WorkerServer } from "tgrid";

main().catch((err) => {
  console.error(err);
  process.exit(-1);
});

async function main() {
  const worker = new WorkerServer<
    {
      apiKey: string;
      model: string;
      baseUrl: string;
      concurrencyRequest: number;
    },
    IAutoBeRpcService,
    IAutoBeRpcListener
  >();

  const header = await worker.getHeader();
  const agent = new AutoBeAgent({
    model: header.model as ILlmSchema.Model,
    vendor: {
      api: new OpenAI({
        apiKey: header.apiKey,
        baseURL: header.baseUrl,
      }),
      model: header.model,
      semaphore: header.concurrencyRequest,
    },
    compiler: () =>
      new AutoBeCompiler({
        realize: {
          test: {
            onOperation: async () => {},
            onReset: async () => {},
          },
        },
      }),
  });
  const rpcService = new AutoBeRpcService({
    agent,
    listener: worker.getDriver(),
  });
  await worker.open(rpcService);
}
