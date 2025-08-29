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

/** Side panel width constant */
const SIDE_PANEL_WIDTH = 450;

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
}

export const AutoBeChatMain = (props: IAutoBeChatMainProps) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const listener: RefObject<AutoBeChatUploadBox.IListener> = useRef({
    handleDragEnter: () => {},
    handleDragLeave: () => {},
    handleDrop: () => {},
    handleDragOver: () => {},
  });

  useEffect(() => {
    if (props.eventGroups.length === 0) return;
    bodyContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [props.eventGroups.length]);

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
        height: "100%",
        width: props.isMobile ? "100%" : `calc(100% - ${SIDE_PANEL_WIDTH}px)`,
        margin: 0,
        backgroundColor: "lightblue",
      }}
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
          <AutoBeEventMovie
            key={index}
            getFiles={props.service.getFiles}
            events={e.events}
            last={index === props.eventGroups.length - 1}
          />
        ))}
      </div>

      {/* Prompt input area */}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: props.isMobile ? 0 : SIDE_PANEL_WIDTH,
          right: 0,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 16,
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
