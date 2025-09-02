import { IAutoBePlaygroundHeader, IAutoBeRpcService } from "@autobe/interface";
import {
  AutoBeAgentProvider,
  AutoBeChatMain,
  AutoBeListener,
  IAutoBeEventGroup,
  IAutoBeUploadConfig,
} from "@autobe/ui";
import { useMediaQuery } from "@autobe/ui/hooks";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";
import { useState } from "react";

export function AutoBePlaygroundChatMovie(
  props: AutoBePlaygroundChatMovie.IProps,
) {
  //----
  // VARIABLES
  //----
  // STATES
  const [, setError] = useState<Error | null>(null);

  //----
  // RENDERERS
  //----

  const isMinWidthLg = useMediaQuery(useMediaQuery.MIN_WIDTH_LG);
  const isMobile = !isMinWidthLg;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {props.title ?? "AutoBE Playground"}
          </Typography>
        </Toolbar>
      </AppBar>
      <div
        style={{
          width: "100%",
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <AutoBeAgentProvider
          listener={props.listener}
          service={props.service}
          header={props.header}
        >
          <AutoBeChatMain
            isMobile={isMobile}
            conversate={async (contents) => {
              await props.service.conversate(contents);
            }}
            setError={setError}
            uploadConfig={props.uploadConfig}
            style={{
              backgroundColor: "lightblue",
            }}
          />
        </AutoBeAgentProvider>
      </div>
    </div>
  );
}
export namespace AutoBePlaygroundChatMovie {
  export interface IProps extends IContext {
    title?: string;
  }
  export interface IContext {
    header: IAutoBePlaygroundHeader<ILlmSchema.Model>;
    service: IAutoBeRpcService;
    listener: AutoBeListener;
    eventGroups?: IAutoBeEventGroup[];
    uploadConfig?: IAutoBeUploadConfig;
  }
}
