import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import React, { forwardRef } from "react";

import TokenUsageCard from "../TokenUsageCard";
import AutoBeEventsMovie from "./events/AutoBeEventsMovie";
import AutoBeHistoryMovie from "./histories/AutoBeHistoryMovie";

interface IChatMovieProps {
  histories: Array<AutoBeHistory>;
  events: Array<AutoBeEvent>;
  tokenUsage: IAutoBeTokenUsageJson | null;
}

const ChatMovie = forwardRef<HTMLDivElement, IChatMovieProps>((props, ref) => {
  const { histories, events } = props;
  return (
    <div className="flex flex-col h-full w-full">
      {props.tokenUsage && <TokenUsageCard tokenUsage={props.tokenUsage} />}

      <div ref={ref} className="flex-1 overflow-auto p-4">
        <div>
          {histories.map((v, i) => (
            <AutoBeHistoryMovie key={i} history={v} />
          ))}
          {events.map((v, i) => (
            <AutoBeEventsMovie key={i} event={v} />
          ))}
        </div>
      </div>
    </div>
  );
});

ChatMovie.displayName = "ChatMovie";

export default ChatMovie;
