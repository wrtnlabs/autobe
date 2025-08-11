import { AutoBeUserMessageContent } from "@autobe/interface";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { RefObject, useRef, useState } from "react";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IAutoBePlaygroundBucket } from "../../structures/IAutoBePlaygroundBucket";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";
import { AutoBePlaygroundChatUploadMovie } from "./AutoBePlaygroundChatUploadMovie";

export const AutoBePlaygroundChatPromptMovie = (
  props: AutoBePlaygroundChatPromptMovie.IProps,
) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [buckets, setBuckets] = useState<IAutoBePlaygroundBucket[]>([]);

  const [dragging, setDragging] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [emptyText, setEmptyText] = useState(false);

  const removeFile = (index: number) => {
    setBuckets(buckets.filter((_, i) => i !== index));
  };

  const conversate = async () => {
    if (enabled === false) return;

    const sendText: string = text.trim();
    const sendBuckets: IAutoBePlaygroundBucket[] = buckets;
    if (sendText.length === 0 && sendBuckets.length === 0) {
      setEmptyText(true);
      return;
    }

    setEnabled(false);
    setEmptyText(false);
    setText("");
    setBuckets([]);

    try {
      const messages: AutoBeUserMessageContent[] = [];
      if (sendText.length > 0) {
        messages.push({
          type: "text",
          text: sendText,
        });
      }
      for (const { content } of sendBuckets) messages.push(content);
      await props.conversate(messages);
    } catch (error) {
      props.setError(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
    setEnabled(true);
  };

  return (
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
      <Paper
        elevation={20}
        sx={{
          maxWidth: 768,
          mx: "auto",
          p: 1.5,
          borderRadius: 2,
          border: dragging ? "3px solid #1976d2" : "2px solid",
          borderColor: dragging ? "#1976d2" : "divider",
          backgroundColor: dragging
            ? "rgba(25, 118, 210, 0.04)"
            : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          transition: "all 0.2s",
          position: "relative",
        }}
      >
        {dragging ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 120,
              py: 4,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "primary.main",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Drop files here to upload
            </Typography>
          </Box>
        ) : null}
        <Box
          sx={{
            display: dragging ? "none" : "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {buckets.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {buckets.map(({ file }, index) => (
                <Chip
                  key={index}
                  label={file.name}
                  size="small"
                  onDelete={() => removeFile(index)}
                  deleteIcon={<CloseIcon />}
                  sx={{
                    maxWidth: 200,
                    "& .MuiChip-label": {
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              ))}
            </Box>
          )}
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            size="small"
            maxRows={8}
            placeholder={
              emptyText
                ? "Cannot send empty message"
                : dragging
                  ? "Drop files here..."
                  : "Conversate with AI Chatbot"
            }
            value={text}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (enabled) void conversate();
              }
            }}
            onChange={(e) => setText(e.target.value)}
            error={emptyText}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: dragging ? "#1976d2" : undefined,
                  borderWidth: 2,
                },
                "&:hover fieldset": {
                  borderWidth: 2,
                },
                "&.Mui-focused fieldset": {
                  borderWidth: 2,
                },
              },
              "& .MuiInputBase-input": {
                // py: 1,
                // px: 1.5,
                fontSize: "0.95rem",
                color: dragging ? "#1976d2" : "inherit",
              },
            }}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <AutoBePlaygroundChatUploadMovie
              enabled={enabled}
              dragging={dragging}
              setEnabled={setEnabled}
              setDragging={setDragging}
              listener={props.listener}
              complete={(v) => {
                setBuckets((o) => [...o, ...v]);
              }}
              uploadConfig={props.uploadConfig}
            />
            <IconButton
              size="small"
              color="primary"
              onClick={() => void conversate()}
              disabled={
                !enabled || (text.trim().length === 0 && buckets.length === 0)
              }
              sx={{
                p: 0.75,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
                "&.Mui-disabled": {
                  backgroundColor: "action.disabledBackground",
                  color: "action.disabled",
                },
              }}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export namespace AutoBePlaygroundChatPromptMovie {
  export interface IProps {
    conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
    setError: (error: Error) => void;
    isMobile: boolean;
    listener: RefObject<IListener>;
    uploadConfig?: IAutoBePlaygroundUploadConfig;
  }
  export interface IListener {
    handleDragEnter: (event: React.DragEvent) => void;
    handleDragLeave: (event: React.DragEvent) => void;
    handleDragOver: (event: React.DragEvent) => void;
    handleDrop: (event: React.DragEvent) => void;
  }
}
