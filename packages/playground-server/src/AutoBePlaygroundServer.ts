import { IAutoBeRpcListener, IAutoBeRpcService } from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "tgrid";
import { VariadicSingleton } from "tstl";

import { IAutoBePlaygroundPredicate } from "./IAutoBePlaygroundPredicate";
import { IAutoBePlaygroundServerProps } from "./IAutoBePlaygroundServerProps";

export class AutoBePlaygroundServer<Header extends object> {
  private readonly server: WebSocketServer<
    Header,
    IAutoBeRpcService,
    IAutoBeRpcListener
  >;

  public constructor(
    private readonly props: IAutoBePlaygroundServerProps<Header>,
  ) {
    this.server = new WebSocketServer();
  }

  public async open(port: number): Promise<void> {
    await this.server.open(port, async (acceptor) => {
      const result: IAutoBePlaygroundPredicate =
        await this.props.predicate(acceptor);
      if (result.type === "reject") {
        await acceptor.reject(result.status, result.reason);
        return;
      }

      const archive = () =>
        save({
          files: result.agent.getFiles(),
          root: result.cwd,
        });
      result.agent.on("analyzeComplete", archive);
      result.agent.on("prismaComplete", archive);
      result.agent.on("interfaceComplete", archive);
      result.agent.on("testComplete", archive);
      result.agent.on("realizeComplete", archive);

      await acceptor.accept(
        new AutoBeRpcService({
          agent: result.agent,
          listener: acceptor.getDriver(),
        }),
      );
    });
  }

  public async close(): Promise<void> {
    await this.server.close();
  }

  public get state() {
    return this.server.state;
  }
}

const save = async (props: {
  root: string;
  files: Record<string, string>;
}): Promise<void> => {
  if (fs.existsSync(props.root))
    await fs.promises.rm(props.root, {
      recursive: true,
    });

  for (const [key, value] of Object.entries(props.files)) {
    const file: string = path.resolve(`${props.root}/${key}`);
    await directory.get(path.dirname(file));
    await fs.promises.writeFile(file, value, "utf8");
  }
};

const directory = new VariadicSingleton(async (location: string) => {
  try {
    await fs.promises.mkdir(location, {
      recursive: true,
    });
  } catch {}
});
