import { useState } from "react";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBePlaygroundConfigureMovie } from "./movies/configure/AutoBePlaygroundConfigureMovie";

export function AutoBePlaygroundApplication() {
  const [next, setNext] = useState<AutoBePlaygroundChatMovie.IProps | null>(
    null,
  );
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: next !== null ? undefined : "auto",
      }}
    >
      {next === null ? (
        <AutoBePlaygroundConfigureMovie onNext={setNext} />
      ) : (
        <AutoBePlaygroundChatMovie {...next} />
      )}
    </div>
  );
}
