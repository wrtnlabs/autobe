import { AutoBeAgent } from "@autobe/agent";
import { IAutoBeCompiler, IAutoBeRpcHeader } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import OpenAI from "openai";
import path from "path";
import { WorkerConnector } from "tgrid";
import typia from "typia";

import { AutoBePlaygroundServer } from "../AutoBePlaygroundServer";

const main = async () => {
  const compiler: WorkerConnector<null, null, IAutoBeCompiler> =
    new WorkerConnector(null, null, "process");
  await compiler.connect(
    `${__dirname}/compiler.${path.extname(__filename).slice(1)}`,
  );

  const server: AutoBePlaygroundServer<IAutoBeRpcHeader<ILlmSchema.Model>> =
    new AutoBePlaygroundServer({
      predicate: async (acceptor) => {
        typia.assert(acceptor.header);
        return {
          type: "accept",
          cwd: `${__dirname}/../../../../playground-result`,
          agent: new AutoBeAgent({
            model: acceptor.header.model,
            vendor: {
              api: new OpenAI({
                apiKey: acceptor.header.vendor.apiKey,
                baseURL: acceptor.header.vendor.baseURL,
              }),
              model: acceptor.header.vendor.model,
              semaphore: acceptor.header.vendor.semaphore,
            },
            config: {
              locale: acceptor.header.locale,
              timezone: acceptor.header.timezone,
            },
            compiler: compiler.getDriver(),
          }),
        };
      },
    });
  await server.open(5_890);
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
