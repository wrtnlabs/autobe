import { AutoBeUserMessageContent, IAutoBeRpcService } from "@autobe/interface";
import { Box, Container } from "@mui/material";
import { RefObject, useEffect, useRef } from "react";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IAutoBePlaygroundEventGroup } from "../../structures/IAutoBePlaygroundEventGroup";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";
import { AutoBePlaygroundEventMovie } from "../events/AutoBePlaygroundEventMovie";
import { AutoBePlaygroundChatUploadMovie } from "./AutoBePlaygroundChatUploadMovie";

export const AutoBePlaygroundChatBodyMovie = (
  props: AutoBePlaygroundChatBodyMovie.IProps,
) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const listener: RefObject<AutoBePlaygroundChatUploadMovie.IListener> = useRef(
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
          gap: 16,
          display: "flex",
          flexDirection: "column",
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

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: props.isMobile ? 0 : AutoBePlaygroundGlobal.SIDE_WIDTH,
          right: 0,
          px: 2,
          pb: 2,
        }}
      >
        <AutoBePlaygroundChatUploadMovie
          listener={listener}
          uploadConfig={props.uploadConfig}
          conversate={props.conversate}
          setError={props.setError}
        />
      </Box>
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
