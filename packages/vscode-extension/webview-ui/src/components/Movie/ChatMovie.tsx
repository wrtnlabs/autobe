import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";

import TokenUsageCard from "../TokenUsageCard";
import AutoBeEventsMovie from "./events/AutoBeEventsMovie";
import AutoBeHistoryMovie from "./histories/AutoBeHistoryMovie";

interface IChatMovieProps {
  histories: Array<AutoBeHistory>;
  events: Array<AutoBeEvent>;
  tokenUsage: IAutoBeTokenUsageJson | null;
}

const ChatMovie = (props: IChatMovieProps) => {
  const { histories, events } = props;
  return (
    <div className="flex flex-col h-full w-full">
      {props.tokenUsage && <TokenUsageCard tokenUsage={props.tokenUsage} />}

      <div className="flex-1 overflow-auto p-4">
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
};

export default ChatMovie;
