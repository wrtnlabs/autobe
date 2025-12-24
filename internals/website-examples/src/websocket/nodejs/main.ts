import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import OpenAI from "openai";
import { WebSocketServer } from "tgrid";

const server: WebSocketServer<null, IAutoBeRpcService, IAutoBeRpcListener> =
  new WebSocketServer();
await server.open(3_001, async (acceptor) => {
  const agent: AutoBeAgent = new AutoBeAgent({
    vendor: {
      api: new OpenAI({ apiKey: "********" }),
      model: "gpt-4.1",
    },
    compiler: async (listener) => new AutoBeCompiler(listener),
  });
  const service: AutoBeRpcService = new AutoBeRpcService({
    agent,
    listener: acceptor.getDriver(),
  });
  await acceptor.accept(service);
});
