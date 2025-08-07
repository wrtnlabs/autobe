import {
  IAutoBeRpcHeader,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  AppBar,
  Container,
  Drawer,
  IconButton,
  Theme,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";
import { useEffect, useRef, useState } from "react";

import { AutoBePlaygroundListener } from "../../structures/AutoBePlaygroundListener";
import { IAutoBePlaygroundEventGroup } from "../../structures/IAutoBePlaygroundEventGroup";
import { AutoBePlaygroundEventMovie } from "../events/AutoBePlaygroundEventMovie";
import { AutoBePlaygroundChatPromptMovie } from "./AutoBePlaygroundChatPromptMovie";
import { AutoBePlaygroundChatSideMovie } from "./AutoBePlaygroundChatSideMovie";

export function AutoBePlaygroundChatMovie(
  props: AutoBePlaygroundChatMovie.IProps,
) {
  //----
  // VARIABLES
  //----
  // REFERENCES
  const upperDivRef = useRef<HTMLDivElement>(null);
  const middleDivRef = useRef<HTMLDivElement>(null);
  const bottomDivRef = useRef<HTMLDivElement>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);

  // STATES
  const [error, setError] = useState<Error | null>(null);
  const [eventGroups, setEventGroups] = useState<IAutoBePlaygroundEventGroup[]>(
    props?.eventGroups ?? [],
  );
  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );
  const [height, setHeight] = useState(130);
  const [openSide, setOpenSide] = useState(false);

  //----
  // EVENT INTERACTIONS
  //----
  const handleResize = () => {
    setTimeout(() => {
      if (
        upperDivRef.current === null ||
        middleDivRef.current === null ||
        bottomDivRef.current === null
      )
        return;
      const newHeight: number =
        upperDivRef.current.clientHeight + bottomDivRef.current.clientHeight;
      if (newHeight !== height) setHeight(newHeight);
    });
  };

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
  useEffect(() => {
    if (eventGroups.length === 0) return;
    bodyContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [eventGroups.length]);

  //----
  // RENDERERS
  //----
  const theme: Theme = useTheme();
  const isMobile: boolean = useMediaQuery(theme.breakpoints.down("lg"));
  const bodyMovie = () => (
    <div
      style={{
        overflowY: "auto",
        height: "100%",
        width: isMobile ? "100%" : `calc(100% - ${SIDE_WIDTH}px)`,
        margin: 0,
        backgroundColor: "lightblue",
      }}
    >
      <Container
        style={{
          paddingBottom: 50,
          width: "100%",
          minHeight: "100%",
          backgroundColor: "lightblue",
          margin: 0,
        }}
        ref={bodyContainerRef}
      >
        {eventGroups.map((e, index) => (
          <AutoBePlaygroundEventMovie
            key={index}
            service={props.service}
            events={e.events}
            last={index === eventGroups.length - 1}
          />
        ))}
      </Container>
    </div>
  );
  const sideMovie = () => (
    <div
      style={{
        width: isMobile ? undefined : SIDE_WIDTH,
        height: "100%",
        overflowY: "auto",
        backgroundColor: "#eeeeee",
      }}
    >
      <Container
        maxWidth={false}
        onClick={isMobile ? () => setOpenSide(false) : undefined}
      >
        <AutoBePlaygroundChatSideMovie
          header={props.header}
          tokenUsage={tokenUsage}
          error={error}
        />
      </Container>
    </div>
  );
  return (
    <>
      <AppBar position="relative" component="div" ref={upperDivRef}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {props.title ?? "AutoBE Playground"}
          </Typography>
          {isMobile ? (
            <>
              <IconButton onClick={() => setOpenSide(true)}>
                <ReceiptLongIcon />
              </IconButton>
            </>
          ) : null}
        </Toolbar>
      </AppBar>
      <div
        ref={middleDivRef}
        style={{
          width: "100%",
          height: `calc(100% - ${height}px)`,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {isMobile ? (
          <>
            {bodyMovie()}
            <Drawer
              anchor="right"
              open={openSide}
              onClose={() => setOpenSide(false)}
            >
              {sideMovie()}
            </Drawer>
          </>
        ) : (
          <>
            {bodyMovie()}
            {sideMovie()}
          </>
        )}
      </div>
      <AppBar
        ref={bottomDivRef}
        position="static"
        component="div"
        color="inherit"
      >
        <AutoBePlaygroundChatPromptMovie
          conversate={async (contents) => {
            props.service.conversate(contents);
          }}
          handleResize={handleResize}
          setError={setError}
        />
      </AppBar>
    </>
  );
}
export namespace AutoBePlaygroundChatMovie {
  export interface IProps extends IContext {
    title?: string;
  }
  export interface IContext {
    header: IAutoBeRpcHeader<ILlmSchema.Model>;
    service: IAutoBeRpcService;
    listener: AutoBePlaygroundListener;
    eventGroups?: IAutoBePlaygroundEventGroup[];
  }
}

const SIDE_WIDTH = 450;
