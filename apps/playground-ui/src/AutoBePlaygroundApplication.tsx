import { useRef } from "react";

import { AutoBePlaygroundChatMovie } from "./movies/chat/AutoBePlaygroundChatMovie";

export function AutoBePlaygroundApplication() {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
      }}
    >
      <AutoBePlaygroundChatMovie title="AutoBE Playground" />
    </div>
  );
}
