import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeGetFilesOptions,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import {
  AutoBeChatBanner,
  AutoBeEventMovie,
  AutoBeProgressEventMovie,
} from "@autobe/ui";
import { IAutoBeAgentInformationProps } from "node_modules/@autobe/ui/src/banner/AutoBeAgentInformation";
import { forwardRef, useEffect, useState } from "react";

import useVsCode from "../../hooks/use-vscode";
import AutoBeHistoryMovie from "./histories/AutoBeHistoryMovie";

interface IChatMovieProps {
  histories: Array<AutoBeHistory>;
  events: Array<AutoBeEvent>;
  tokenUsage: IAutoBeTokenUsageJson | null;
  onGoBack?: () => void;
  getFiles: (
    options?: Partial<IAutoBeGetFilesOptions>,
  ) => Promise<Record<string, string>>;
}

export const isAutoBeProgressEventBase = (
  event: AutoBeEvent,
): event is AutoBeProgressEventMovie.IProps["event"] => {
  return (
    "total" in event &&
    "completed" in event &&
    typeof event.total === "number" &&
    typeof event.completed === "number"
  );
};

const ChatMovie = forwardRef<HTMLDivElement, IChatMovieProps>((props, ref) => {
  const { histories, events } = props;
  const [header, setHeader] = useState<
    IAutoBeAgentInformationProps["header"] | null
  >(null);
  const vscode = useVsCode();

  useEffect(() => {
    vscode.onMessage((message) => {
      if (message.type === "res_get_config") {
        setHeader({
          model: "chatgpt",
          locale: "ko-KR",
          vendor: {
            model: message.data.model ?? "gpt-4.1",
            semaphore: 16,
          },
          timezone: "Asia/Seoul",
        });
      }
    });
    vscode.postMessage({
      type: "req_get_config",
    });
  }, []);

  const compactEvents = events.filter((v, idx) => {
    if (idx === events.length - 1) {
      return true;
    }
    const nextEvent = events[idx + 1];
    if (isAutoBeProgressEventBase(v) && v.type === nextEvent.type) {
      return false;
    }

    return true;
  });

  const logList = [
    ...histories.map((v) => ({ ...v, _type: "history" }) as const),
    ...compactEvents.map((v) => ({ ...v, _type: "event" }) as const),
  ].sort(
    (a, b) =>
      new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf(),
  );

  return (
    <div className="flex flex-col h-full w-full">
      {props.tokenUsage && header && (
        <AutoBeChatBanner header={header} tokenUsage={props.tokenUsage} />
      )}

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
        <div className="flex flex-col gap-4">
          {logList.map((v, i) =>
            v._type === "history" ? (
              <AutoBeHistoryMovie key={i} history={v} />
            ) : (
              <AutoBeEventMovie
                key={i}
                getFiles={props.getFiles}
                events={[v]}
                last={i === logList.length - 1}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
});

ChatMovie.displayName = "ChatMovie";

export default ChatMovie;
