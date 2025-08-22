import { IAutoBePlaygroundReplay } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { useEffect, useState } from "react";

import { AutoBePlaygroundReplayIndexMovie } from "./movies/replay/AutoBePlaygroundReplayIndexMovie";

export function AutoBePlaygroundReplayIndexApplication() {
  const [replays, setRelays] = useState<
    IAutoBePlaygroundReplay.ISummary[] | null
  >(null);
  useEffect(() => {
    const load = async () => {
      setRelays(
        await pApi.functional.autobe.playground.replay.index(CONNECTION),
      );
    };
    load().catch(console.error);
  }, []);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {replays === null ? (
        <>Loading Replays...</>
      ) : (
        <AutoBePlaygroundReplayIndexMovie replays={replays} />
      )}
    </div>
  );
}

const CONNECTION: pApi.IConnection = {
  host: "http://localhost:5890",
};
