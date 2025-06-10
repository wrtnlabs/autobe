import {
  AutoBeEvent,
  IAutoBeRpcHeader,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SendIcon from "@mui/icons-material/Send";
import {
  AppBar,
  Button,
  Container,
  Drawer,
  IconButton,
  Input,
  Theme,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ILlmSchema } from "@samchon/openapi";
import { useEffect, useRef, useState } from "react";

import { AutoBePlaygroundListener } from "../../structures/AutoBePlaygroundListener";
import { AutoBePlaygroundEventMovie } from "../events/AutoBePlaygroundEventMovie";
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
  const inputRef = useRef<HTMLInputElement>(null);

  // STATES
  const [error, setError] = useState<Error | null>(null);
  const [text, setText] = useState("");
  const [events, setEvents] = useState<AutoBeEvent[]>(props?.events ?? []);
  const [tokenUsage, setTokenUsage] = useState<IAutoBeTokenUsageJson | null>(
    null,
  );
  const [height, setHeight] = useState(122);
  const [enabled, setEnabled] = useState(true);
  const [openSide, setOpenSide] = useState(false);

  //----
  // EVENT INTERACTIONS
  //----
  const handleKeyUp = async (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      if (enabled === false) {
        event.preventDefault();
      } else {
        await conversate();
      }
    }
  };

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

  const conversate = async () => {
    setText("");
    setEnabled(false);
    handleResize();
    try {
      await props.service.conversate(text);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
        setError(error);
      } else setError(new Error("Unknown error"));
      return;
    }
    setTokenUsage(await props.service.getTokenUsage());
    setEnabled(true);
  };

  useEffect(() => {
    props.listener.on(async (e) => {
      props.service
        .getTokenUsage()
        .then(setTokenUsage)
        .catch(() => {});
      setEvents((prev) => [...prev, e]);
    });
    props.service
      .getTokenUsage()
      .then(setTokenUsage)
      .catch(() => {});
  }, []);

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
        {events.map((e, index) => (
          <AutoBePlaygroundEventMovie
            key={index}
            service={props.service}
            event={e}
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
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AutoBE Playground
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
        <Toolbar>
          <Input
            inputRef={inputRef}
            fullWidth
            placeholder="Conversate with AI Chatbot"
            value={text}
            multiline={true}
            onKeyUp={(e) => void handleKeyUp(e).catch(() => {})}
            onChange={(e) => {
              setText(e.target.value);
              handleResize();
            }}
          />
          <Button
            variant="contained"
            style={{ marginLeft: 10 }}
            startIcon={<SendIcon />}
            disabled={!enabled}
            onClick={() => void conversate().catch(() => {})}
          >
            Send
          </Button>
        </Toolbar>
      </AppBar>
    </>
  );
}
export namespace AutoBePlaygroundChatMovie {
  export interface IProps {
    header: IAutoBeRpcHeader<ILlmSchema.Model>;
    service: IAutoBeRpcService;
    listener: AutoBePlaygroundListener;
    events?: AutoBeEvent[];
  }
}

const SIDE_WIDTH = 450;
