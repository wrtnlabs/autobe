import {
  AutoBeUserMessageContent,
  IAutoBePlaygroundHeader,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { RefObject, useEffect, useRef } from "react";

import {
  AutoBeChatBanner,
  AutoBeChatUploadBox,
  AutoBeEventMovie,
  AutoBeListenerState,
  IAutoBeEventGroup,
  IAutoBeUploadConfig,
} from ".";
import { useMediaQuery } from "./hooks";

export interface IAutoBeChatMainProps {
  isMobile: boolean;
  eventGroups: IAutoBeEventGroup[];
  service: IAutoBeRpcService;
  conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
  setError: (error: Error) => void;
  uploadConfig?: IAutoBeUploadConfig;
  tokenUsage: IAutoBeTokenUsageJson | null;
  header: IAutoBePlaygroundHeader<ILlmSchema.Model>;
  state: AutoBeListenerState;
  className?: string;
  style?: React.CSSProperties;
}

export const AutoBeChatMain = (props: IAutoBeChatMainProps) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const listener: RefObject<AutoBeChatUploadBox.IListener> = useRef({
    handleDragEnter: () => {},
    handleDragLeave: () => {},
    handleDrop: () => {},
    handleDragOver: () => {},
  });

  useEffect(() => {
    if (props.eventGroups.length === 0) return;
    scrollAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [bodyContainerRef.current?.scrollHeight]);

  const isMinWidthLg = useMediaQuery(useMediaQuery.MIN_WIDTH_LG);
  return (
    <div
      onDragEnter={(e) => listener.current.handleDragEnter(e)}
      onDragLeave={(e) => listener.current.handleDragLeave(e)}
      onDragOver={(e) => listener.current.handleDragOver(e)}
      onDrop={(e) => listener.current.handleDrop(e)}
      style={{
        position: "relative",
        overflowY: "auto",
        margin: 0,
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        ...props.style,
      }}
      className={props.className}
      ref={bodyContainerRef}
    >
      {!isMinWidthLg && (
        <AutoBeChatBanner
          header={props.header}
          tokenUsage={props.tokenUsage}
          state={props.state}
        />
      )}

      <div
        style={{
          padding: "2rem",
          gap: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {props.eventGroups.map((e, index) => (
          <AutoBeEventMovie
            key={index}
            getFiles={props.service.getFiles}
            events={e.events}
            last={index === props.eventGroups.length - 1}
          />
        ))}
      </div>

      {/*
       * Prompt input area
       * this flexGrow: 1 means that the prompt input area will take up the remaining space
       * so that the upload box will be at the bottom of the screen
       */}
      <div
        style={{ flexGrow: 1, minHeight: "1rem" }}
        ref={scrollAnchorRef}
      ></div>
      <div
        style={{
          position: "sticky",
          bottom: 16,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <AutoBeChatUploadBox
          listener={listener}
          uploadConfig={props.uploadConfig}
          conversate={props.conversate}
          setError={props.setError}
        />
      </div>
    </div>
  );
};
export default AutoBeChatMain;
