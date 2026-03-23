import { AutoBeMockAgent } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBePhase,
  IAutoBePlaygroundReplay,
  IAutoBeRpcListener,
  IAutoBeRpcService,
} from "@autobe/interface";
import { AutoBeRpcService } from "@autobe/rpc";
import { WebSocketAcceptor } from "tgrid";
import { sleep_for } from "tstl";

import { AutoBePlaygroundSessionCompiler } from "../sessions/acceptors/AutoBePlaygroundSessionCompiler";

const PHASES_DESC: AutoBePhase[] = [
  "realize",
  "test",
  "interface",
  "database",
  "analyze",
];

export namespace AutoBePlaygroundExampleSocketProvider {
  /**
   * Directly replay example data over WebSocket.
   *
   * Creates an `AutoBeMockAgent` from example storage and streams events to the
   * client. No database session is created — purely in-memory.
   */
  export const replay = async (props: {
    acceptor: WebSocketAcceptor<any, IAutoBeRpcService, IAutoBeRpcListener>;
    vendor: string;
    project: string;
    delay?: number | undefined;
  }): Promise<void> => {
    const replayData: IAutoBePlaygroundReplay | null = await buildReplay(
      props.vendor,
      props.project,
    );
    if (replayData === null) {
      await props.acceptor.reject(
        1008,
        `No example data found for ${props.vendor}/${props.project}`,
      );
      return;
    }

    const agent: AutoBeMockAgent = new AutoBeMockAgent({
      replay: replayData,
      compiler: () => AutoBePlaygroundSessionCompiler.get(),
      delay: props.delay !== undefined ? () => props.delay : undefined,
    });
    await props.acceptor.accept(
      new AutoBeRpcService({
        agent,
        listener: props.acceptor.getDriver(),
        onStart: () => {},
        onComplete: () => {},
      }),
    );
    props.acceptor.ping(500);
    await sleep_for(100);

    void props.acceptor
      .getDriver()
      .enable(true)
      .catch(() => {});

    // Wait for disconnect
    await props.acceptor.join();
  };

  const buildReplay = async (
    vendor: string,
    project: string,
  ): Promise<IAutoBePlaygroundReplay | null> => {
    const proj = project as AutoBeExampleProject;

    const safeGetSnapshots = async (
      phase: AutoBePhase,
    ): Promise<AutoBeEventSnapshot[] | null> => {
      const exists = await AutoBeExampleStorage.has({
        vendor,
        project: proj,
        phase,
      });
      if (!exists) return null;
      return AutoBeExampleStorage.getSnapshots({
        vendor,
        project: proj,
        phase,
      });
    };

    // Find the last available phase for loading histories
    let historiesPhase: AutoBePhase | null = null;
    for (const phase of PHASES_DESC) {
      const exists = await AutoBeExampleStorage.has({
        vendor,
        project: proj,
        phase,
      });
      if (exists) {
        historiesPhase = phase;
        break;
      }
    }
    if (historiesPhase === null) return null;

    return {
      vendor,
      project,
      histories: await AutoBeExampleStorage.getHistories({
        vendor,
        project: proj,
        phase: historiesPhase,
      }),
      analyze: await safeGetSnapshots("analyze"),
      database: await safeGetSnapshots("database"),
      interface: await safeGetSnapshots("interface"),
      test: await safeGetSnapshots("test"),
      realize: await safeGetSnapshots("realize"),
    };
  };
}
