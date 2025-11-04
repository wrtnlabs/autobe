import { AutoBeMockAgent } from "@autobe/agent";
import { ArchiveStorage } from "@autobe/filesystem";
import {
  AutoBeExampleProject,
  IAutoBePlaygroundReplay,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";

import { AutoBePlaygroundAcceptor } from "./AutoBePlaygroundAcceptor";
import { AutoBePlaygroundReplayComputer } from "./AutoBePlaygroundReplayComputer";
import { AutoBePlaygroundReplayStorage } from "./AutoBePlaygroundReplayStorage";

export namespace AutoBePlaygroundReplayProvider {
  export const index = async (): Promise<
    IAutoBePlaygroundReplay.ISummary[]
  > => {
    const all = (vendor: string): Promise<IAutoBePlaygroundReplay[]> =>
      AutoBePlaygroundReplayStorage.getAll(vendor);
    const replays: IAutoBePlaygroundReplay[][] = await Promise.all(
      (await ArchiveStorage.getVendorModels()).map(all),
    );
    return replays.flat().map(AutoBePlaygroundReplayComputer.summarize);
  };

  export const get = async (
    acceptor: WebSocketAcceptor<
      undefined,
      IAutoBeRpcService,
      IAutoBeRpcListener
    >,
    props: IAutoBePlaygroundReplay.IProps,
  ): Promise<void> => {
    const replay: IAutoBePlaygroundReplay | null =
      await AutoBePlaygroundReplayStorage.get({
        vendor: props.vendor,
        project: typia.assert<AutoBeExampleProject>(props.project),
      });
    if (replay === null) {
      await acceptor.reject(1002, "Unable to find the matched replay");
      return;
    }
    await AutoBePlaygroundAcceptor.accept({
      prefix: `${props.vendor}/${props.project}/replay`,
      acceptor,
      agent: (compiler) =>
        new AutoBeMockAgent({
          replay,
          compiler: () => compiler,
        }),
    });
  };
}
