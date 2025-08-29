import {
  IAutoBePlaygroundHeader,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import {
  AutoBeChatMain,
  AutoBeListener,
  IAutoBeEventGroup,
  IAutoBeUploadConfig,
} from "@autobe/ui";
import { useMediaQuery } from "@autobe/ui/hooks";
import { AppBar, Container, Toolbar, Typography } from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";
import { useEffect, useState } from "react";

import { AutoBePlaygroundChatSideMovie } from "./AutoBePlaygroundChatSideMovie";

export function AutoBePlaygroundChatMovie(
  props: AutoBePlaygroundChatMovie.IProps,
) {
  //----
  // VARIABLES
  //----
  // STATES
  const [error, setError] = useState<Error | null>(null);
  const [eventGroups, setEventGroups] = useState<IAutoBeEventGroup[]>(
    props?.eventGroups ?? [],
  );
  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );

  //----
  // EVENT INTERACTIONS
  //----
  useEffect(() => {
    props.listener.on(async (e) => {
      props.service
        .getTokenUsage()
        .then(setTokenUsage)
        .catch(() => {});
      setEventGroups(e);
    });
    props.service
      .getTokenUsage()
      .then(setTokenUsage)
      .catch(() => {});
  }, []);

  //----
  // RENDERERS
  //----

  const isMinWidthLg = useMediaQuery(useMediaQuery.MIN_WIDTH_LG);
  const isMobile = !isMinWidthLg;
  const sideMovie = () => (
    <div
      style={{
        overflowY: "auto",
        backgroundColor: "#eeeeee",
        minWidth: "24rem",
      }}
    >
      <Container maxWidth={false}>
        <AutoBePlaygroundChatSideMovie
          header={props.header}
          tokenUsage={tokenUsage}
          error={error}
          state={props.listener.getState()}
        />
      </Container>
    </div>
  );
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
        {isMobile || sideMovie()}

        <AutoBeChatMain
          isMobile={isMobile}
          eventGroups={eventGroups}
          service={props.service}
          conversate={async (contents) => {
            await props.service.conversate(contents);
          }}
          setError={setError}
          uploadConfig={props.uploadConfig}
          tokenUsage={tokenUsage}
          header={props.header}
          state={props.listener.getState()}
        />
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
