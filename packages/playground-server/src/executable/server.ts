import { AutoBeAgent, AutoBeMockAgent } from "@autobe/agent";
import {
  IAutoBeAgent,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeRpcHeader,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import fs from "fs";
import OpenAI from "openai";
import path from "path";
import { Driver, WebSocketAcceptor, WorkerConnector } from "tgrid";
import typia from "typia";

import { AutoBePlaygroundServer } from "../AutoBePlaygroundServer";

const ROOT = `${__dirname}/../../../..`;

const createRealAgent = (
  compiler: Driver<IAutoBeCompiler>,
  acceptor: WebSocketAcceptor<
    IAutoBeRpcHeader<ILlmSchema.Model>,
    IAutoBeRpcService,
    IAutoBeRpcListener
  >,
): IAutoBeAgent => {
  typia.assert(acceptor.header);
  return new AutoBeAgent({
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
    compiler: () => compiler,
  });
};

const createMockAgent = async (
  path: string,
  compiler: Driver<IAutoBeCompiler>,
): Promise<IAutoBeAgent> => {
  const params: URLSearchParams = new URLSearchParams(
    path.indexOf("?") !== -1 ? path.split("?")[1] : "",
  );
  const load = async <T>(title: string): Promise<T> => {
    const vendor: string = params.get("vendor") ?? "openai/gpt-4.1";
    const type: string = params.get("type") ?? "bbs-backend";
    const location: string = `${ROOT}/test/assets/histories/${vendor}/${type}.${title}.json`;
    const content: string = await fs.promises.readFile(location, "utf-8");
    return JSON.parse(content) as T;
  };
  const preset: AutoBeMockAgent.IPreset = {
    // histories: await load("realize"),
    histories: await load("test"),
    analyze: await load("analyze.snapshots"),
    prisma: await load("prisma.snapshots"),
    interface: await load("interface.snapshots"),
    test: await load("test.snapshots"),
    // realize: await load("realize.snapshots"),
  };
  return new AutoBeMockAgent({
    compiler: () => compiler,
    preset,
  });
};

const main = async () => {
  // @todo: must be separated to each acceptance
  const listener: IAutoBeCompilerListener = {
    realize: {
      test: {
        onOperation: async () => {},
        onReset: async () => {},
      },
    },
  };
  const compiler: WorkerConnector<
    null,
    IAutoBeCompilerListener,
    IAutoBeCompiler
  > = new WorkerConnector(null, listener, "process");
  await compiler.connect(
    `${__dirname}/compiler.${path.extname(__filename).slice(1)}`,
  );

  const server: AutoBePlaygroundServer<IAutoBeRpcHeader<ILlmSchema.Model>> =
    new AutoBePlaygroundServer({
      predicate: async (acceptor) => ({
        type: "accept",
        cwd: `${ROOT}/playground-result`,
        agent: acceptor.path.startsWith("/mock")
          ? await createMockAgent(acceptor.path, compiler.getDriver())
          : createRealAgent(compiler.getDriver(), acceptor),
      }),
    });
  await server.open(5_890);
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
