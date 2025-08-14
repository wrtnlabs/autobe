import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { useEffect, useRef, useState } from "react";

import { IResponseGetSessionList } from "../../../interface/src";
import ChatMovie from "../components/Movie/ChatMovie";
import TextInput from "../components/TextInput";
import useVsCode from "../hooks/use-vscode";

const WelcomeMessage = (props: {
  className: string;
  onClickSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}) => {
  const vscode = useVsCode();

  const [sessionList, setSessionList] = useState<
    IResponseGetSessionList["data"]["sessionList"]
  >([]);

  vscode.onMessage((message) => {
    switch (message.type) {
      case "res_get_session_list":
        setSessionList(() => message.data.sessionList);
        break;
    }
  });

  useEffect(() => {
    vscode.postMessage({
      type: "req_get_session_list",
    });
  }, []);

  return (
    <div className={props.className}>
      {sessionList.length === 0 ? (
        <div>
          <p>안녕하세요! 무엇에 만들고 싶으신가요?</p>
          <p>
            더 많은 내용은 저희{" "}
            <a
              href="https://wrtnlabs.io/autobe"
              target="_blank"
              className="text-blue-500"
            >
              문서
            </a>
            를 참고해주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {sessionList.map((session) => (
            <div
              key={session.sessionId}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer relative group"
              onClick={() => {
                props.onClickSession(session.sessionId);
              }}
            >
              <div className="space-y-2">
                <div className="text-sm text-gray-800 leading-relaxed line-clamp-2">
                  {session.lastConversation}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {new Date(session.updatedAt).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* 삭제 버튼 */}
              <button
                className="absolute top-3 right-3 w-7 h-7 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={(e) => {
                  vscode.postMessage({
                    type: "req_remove_session",
                    data: {
                      sessionId: session.sessionId,
                    },
                  });

                  setSessionList((prev) =>
                    prev.filter((s) => s.sessionId !== session.sessionId),
                  );
                  props.onDeleteSession?.(session.sessionId);
                }}
                title="세션 삭제"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const vscode = useVsCode();
  const [histories, setHistories] = useState<Array<AutoBeHistory>>([]);
  const [event, setEvent] = useState<Array<AutoBeEvent>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 뒤로 가기 함수
  const handleGoBack = () => {
    setHistories([]);
    setEvent([]);
    setSessionId(null);
    setTokenUsage(null);
  };

  vscode.onMessage((message) => {
    switch (message.type) {
      case "on_event_auto_be":
        setEvent((prev) => [...prev, message.data]);
        break;
      case "on_history_auto_be":
        setHistories((prev) => [...prev, message.data]);
        break;
      case "res_create_chat_session":
        setSessionId(message.data.sessionId);
        break;
      case "on_event_update_token_usage":
        setTokenUsage(message.data);
        break;
      case "res_get_session_detail":
        setEvent(message.data.events);
        setHistories(message.data.history);
        setTokenUsage(message.data.tokenUsage);
        break;
      default:
        break;
    }
  });

  // 새 메시지가 추가될 때 자동으로 스크롤을 하단으로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [histories, event]);

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 영역 */}
      <div className="flex-1 overflow-hidden">
        {histories.length === 0 && event.length === 0 ? (
          <WelcomeMessage
            className="flex h-full justify-center items-center"
            onClickSession={(id) => {
              setSessionId(id);
              vscode.postMessage({
                type: "req_get_session_detail",
                data: {
                  sessionId: id,
                },
              });
            }}
          />
        ) : (
          <ChatMovie
            ref={chatContainerRef}
            histories={histories}
            events={event}
            tokenUsage={tokenUsage}
            onGoBack={handleGoBack}
          />
        )}
      </div>

      {/* 입력창 - 하단 고정 */}
      <div className="flex-shrink-0 p-4">
        <TextInput
          defaultValue={input}
          setInput={setInput}
          onEnterKey={() => {
            if (input.trim() === "") {
              return;
            }

            if (sessionId === null) {
              vscode.postMessage({
                type: "req_create_chat_session",
                data: {
                  message: input,
                },
              });
              setInput("");
              return;
            }

            vscode.postMessage({
              type: "req_conversate_chat_session",
              data: {
                sessionId,
                message: input,
              },
            });
            setInput("");
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
