import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { useEffect, useRef, useState } from "react";

import ChatMovie from "../components/Movie/ChatMovie";
import TextInput from "../components/TextInput";
import useVsCode from "../hooks/use-vscode";

const WelcomeMessage = (props: { className: string }) => {
  return (
    <div className={props.className}>
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
  const chatBodyRef = useRef<HTMLDivElement>(null);

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
      default:
        break;
    }
  });

  // 스크롤 최하단으로 이동
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [histories]);

  return (
    <div className="flex items-center h-full flex-col">
      {/* Movie */}
      <div className="h-full w-full">
        <div className="h-full w-full">
          {histories.length === 0 && event.length === 0 ? (
            <WelcomeMessage className="flex h-full justify-center items-center" />
          ) : (
            <ChatMovie
              histories={histories}
              events={event}
              tokenUsage={tokenUsage}
            />
          )}
        </div>
      </div>
      {/* 입력창 */}
      <div className="p-4 flex relative">
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
