import {
  IAutoBeAgent,
  IAutoBeCompiler,
  IAutoBeCompilerListener,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import fs from "fs";
import path from "path";
import { WebSocketAcceptor, WorkerConnector } from "tgrid";
import { Singleton, VariadicSingleton } from "tstl";

export namespace AutoBePlaygroundAcceptor {
  export const accept = async (
    acceptor: WebSocketAcceptor<any, IAutoBeRpcService, IAutoBeRpcListener>,
    factory: (compiler: IAutoBeCompiler) => IAutoBeAgent,
  ): Promise<void> => {
    const agent: IAutoBeAgent = factory(await compiler.get());

    const archive = async () => save(await agent.getFiles());
    agent.on("analyzeComplete", archive);
    agent.on("prismaComplete", archive);
    agent.on("interfaceComplete", archive);
    agent.on("testComplete", archive);
    agent.on("realizeComplete", archive);

    await acceptor.accept(
      new AutoBeRpcService({
        agent,
        listener: acceptor.getDriver(),
      }),
    );
  };
}

const compiler = new Singleton(async (): Promise<IAutoBeCompiler> => {
  const compiler: WorkerConnector<
    null,
    IAutoBeCompilerListener,
    IAutoBeCompiler
  > = new WorkerConnector(
    null,
    {
      realize: {
        test: {
          onOperation: async () => {},
          onReset: async () => {},
        },
      },
    },
    "process",
  );
  await compiler.connect(
    `${__dirname}/../executable/compiler.${path.extname(__filename).slice(1)}`,
  );
  return compiler.getDriver();
});

const save = async (files: Record<string, string>): Promise<void> => {
  if (fs.existsSync(ROOT))
    await fs.promises.rm(ROOT, {
      recursive: true,
    });

  const directory = new VariadicSingleton(async (location: string) => {
    try {
      await fs.promises.mkdir(location, {
        recursive: true,
      });
    } catch {}
  });
  for (const [key, value] of Object.entries(files)) {
    const file: string = path.resolve(`${ROOT}/${key}`);
    await directory.get(path.dirname(file));
    await fs.promises.writeFile(file, value, "utf8");
  }
};

const ROOT = `${__dirname}/../../../../playground-result`;
