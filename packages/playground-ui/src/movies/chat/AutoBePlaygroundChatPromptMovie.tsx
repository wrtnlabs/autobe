import { AutoBeUserMessageContent } from "@autobe/interface";
import SendIcon from "@mui/icons-material/Send";
import { Button, Input, Toolbar } from "@mui/material";
import { useRef, useState } from "react";
import { tags } from "typia";

export const AutoBePlaygroundChatPromptMovie = (
  props: AutoBePlaygroundChatPromptMovie.IProps,
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [emptyText, setEmptyText] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const handleKeyUp = async (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      if (enabled === false) event.preventDefault();
      else await conversate();
    }
  };
  const conversate = async () => {
    setText("");
    if (text.trim().length === 0) {
      setEmptyText(true);
      return;
    }
    setEmptyText(false);
    setEnabled(false);
    props.handleResize();

    try {
      await props.conversate([
        {
          type: "text",
          text,
        },
      ]);
    } catch (error) {
      props.setError(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
    setEnabled(true);
  };

  return (
    <Toolbar>
      <Input
        inputRef={inputRef}
        fullWidth
        placeholder={
          emptyText ? "Cannot send empty message" : "Conversate with AI Chatbot"
        }
        value={text}
        multiline={true}
        onKeyUp={(e) => void handleKeyUp(e).catch(() => {})}
        onChange={(e) => {
          setText(e.target.value);
          props.handleResize();
        }}
        error={emptyText}
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
  );
};
export namespace AutoBePlaygroundChatPromptMovie {
  export interface IProps {
    conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
    handleResize: () => void;
    setError: (error: Error) => void;
    upload?: (file: File) => Promise<string & tags.Format<"uri">>;
  }
}
