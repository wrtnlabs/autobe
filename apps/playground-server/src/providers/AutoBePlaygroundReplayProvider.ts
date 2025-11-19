import { AutoBeMockAgent } from "@autobe/agent";
import { AutoBeExampleStorage, AutoBeReplayStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  IAutoBePlaygroundReplay,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { WebSocketAcceptor } from "tgrid";
import typia from "typia";

import { AutoBePlaygroundAcceptor } from "./AutoBePlaygroundAcceptor";

export namespace AutoBePlaygroundReplayProvider {
  export const index = async (): Promise<
    IAutoBePlaygroundReplay.ISummary[]
  > => {
    const all = (vendor: string): Promise<IAutoBePlaygroundReplay.ISummary[]> =>
      AutoBeReplayStorage.getAllSummaries(vendor);
    const replays: IAutoBePlaygroundReplay.ISummary[][] = await Promise.all(
      (await AutoBeExampleStorage.getVendorModels()).map(all),
    );
    return replays.flat();
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
      await AutoBeReplayStorage.get({
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
