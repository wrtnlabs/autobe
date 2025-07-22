import { useRef, useState } from "react";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";
import { AutoBePlaygroundConfigureMovie } from "./movies/configure/AutoBePlaygroundConfigureMovie";

export function AutoBePlaygroundApplication() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [next, setNext] = useState<AutoBePlaygroundChatMovie.IProps | null>(
    null,
  );
  return (
    <div
      ref={scrollRef}
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
