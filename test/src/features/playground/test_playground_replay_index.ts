import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { AutoBePlaygroundServer } from "@autobe/playground-server";
import typia from "typia";

import pApi from "../../../../apps/playground-api/src";

export const test_playground_replay_index = async () => {
  const connection: pApi.IConnection = {
    host: `http://localhost:${AutoBePlaygroundServer.DEFAULT_PORT}`,
  };
  const replays: IAutoBePlaygroundReplay.ISummary[] =
    await pApi.functional.autobe.playground.replay.index(connection);
  typia.assertGuard(replays);
};
