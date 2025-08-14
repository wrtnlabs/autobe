import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { forwardRef } from "react";

import TokenUsageCard from "../TokenUsageCard";
import AutoBeEventsMovie from "./events/AutoBeEventsMovie";
import AutoBeHistoryMovie from "./histories/AutoBeHistoryMovie";

interface IChatMovieProps {
  histories: Array<AutoBeHistory>;
  events: Array<AutoBeEvent>;
  tokenUsage: IAutoBeTokenUsageJson | null;
  onGoBack?: () => void;
}

const ChatMovie = forwardRef<HTMLDivElement, IChatMovieProps>((props, ref) => {
  const { histories, events } = props;
  return (
    <div className="flex flex-col h-full w-full">
      {props.tokenUsage && <TokenUsageCard tokenUsage={props.tokenUsage} />}

      {/* 뒤로 가기 버튼 */}
      {props.onGoBack && (
        <div className="flex-shrink-0 p-3">
          <button
            onClick={props.onGoBack}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">뒤로 가기</span>
          </button>
        </div>
      )}

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
