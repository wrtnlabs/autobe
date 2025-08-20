import { AutoBeUserMessageContent, IAutoBeRpcService } from "@autobe/interface";
import { Container } from "@mui/material";
import { RefObject, useEffect, useRef } from "react";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IAutoBePlaygroundEventGroup } from "../../structures/IAutoBePlaygroundEventGroup";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";
import { AutoBePlaygroundEventMovie } from "../events/AutoBePlaygroundEventMovie";
import { AutoBePlaygroundChatPromptMovie } from "./AutoBePlaygroundChatPromptMovie";

export const AutoBePlaygroundChatBodyMovie = (
  props: AutoBePlaygroundChatBodyMovie.IProps,
) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const listener: RefObject<AutoBePlaygroundChatPromptMovie.IListener> = useRef(
    {
      handleDragEnter: () => {},
      handleDragLeave: () => {},
      handleDrop: () => {},
      handleDragOver: () => {},
    },
  );

  useEffect(() => {
    if (props.eventGroups.length === 0) return;
    bodyContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [props.eventGroups.length]);

  return (
    <div
      onDragEnter={(e) => listener.current.handleDragEnter(e)}
      onDragLeave={(e) => listener.current.handleDragLeave(e)}
      onDragOver={(e) => listener.current.handleDragOver(e)}
      onDrop={(e) => listener.current.handleDrop(e)}
      style={{
        position: "relative",
        overflowY: "auto",
        height: "100%",
        width: props.isMobile
          ? "100%"
          : `calc(100% - ${AutoBePlaygroundGlobal.SIDE_WIDTH}px)`,
        margin: 0,
        backgroundColor: "lightblue",
      }}
    >
      <Container
        style={{
          paddingBottom: 120,
          width: "100%",
          minHeight: "100%",
          backgroundColor: "lightblue",
          maxWidth: "100%",
          margin: 0,
        }}
        ref={bodyContainerRef}
      >
        {props.eventGroups.map((e, index) => (
          <AutoBePlaygroundEventMovie
            key={index}
            service={props.service}
            events={e.events}
            last={index === props.eventGroups.length - 1}
          />
        ))}
      </Container>

      {/* Prompt input area */}
      <AutoBePlaygroundChatPromptMovie {...props} listener={listener} />
    </div>
  );
};
export namespace AutoBePlaygroundChatBodyMovie {
  export interface IProps {
    isMobile: boolean;
    eventGroups: IAutoBePlaygroundEventGroup[];
    service: IAutoBeRpcService;
    conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
    setError: (error: Error) => void;
    uploadConfig?: IAutoBePlaygroundUploadConfig;
  }
}
