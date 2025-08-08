import { AutoBeUserMessageContent, IAutoBeRpcService } from "@autobe/interface";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Chip,
  Container,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IAutoBePlaygroundBucket } from "../../structures/IAutoBePlaygroundBucket";
import { IAutoBePlaygroundEventGroup } from "../../structures/IAutoBePlaygroundEventGroup";
import { AutoBePlaygroundFileUploader } from "../../utils/AutoBePlaygroundFileUploader";
import { AutoBePlaygroundEventMovie } from "../events/AutoBePlaygroundEventMovie";
import { AutoBePlaygroundChatVoiceMovie } from "./AutoBePlaygroundChatVoiceMovie";

export const AutoBePlaygroundChatBodyMovie = (
  props: AutoBePlaygroundChatBodyMovie.IProps,
) => {
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [emptyText, setEmptyText] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [buckets, setBuckets] = useState<IAutoBePlaygroundBucket[]>([]);

  useEffect(() => {
    if (props.eventGroups.length === 0) return;
    bodyContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [props.eventGroups.length]);

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    setEnabled(false);
    const newFiles: IAutoBePlaygroundBucket[] = [];
    for (const file of fileList) {
      try {
        newFiles.push(await AutoBePlaygroundFileUploader.compose(props, file));
      } catch {
        continue;
      }
    }
    setBuckets([...buckets, ...newFiles]);
    setEnabled(true);
  };

  const removeFile = (index: number) => {
    setBuckets(buckets.filter((_, i) => i !== index));
  };

  const conversate = async () => {
    setText("");
    const hasContent = text.trim().length > 0 || buckets.length > 0;

    if (!hasContent) {
      setEmptyText(true);
      return;
    }

    setEmptyText(false);
    setEnabled(false);

    try {
      const messages: AutoBeUserMessageContent[] = [];

      // Add text message if present
      if (text.trim().length > 0) {
        messages.push({
          type: "text",
          text,
        });
      }

      // Add attached files as file messages
      for (const { content } of buckets) messages.push(content);

      await props.conversate(messages);
      setBuckets([]); // Clear attached files after sending
    } catch (error) {
      props.setError(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
    setEnabled(true);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the entire container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
            border: isDragging ? "3px solid #1976d2" : "2px solid",
            borderColor: isDragging ? "#1976d2" : "divider",
            backgroundColor: isDragging
              ? "rgba(25, 118, 210, 0.04)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          {isDragging ? (
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
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                    : isDragging
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
                disabled={!enabled}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: isDragging ? "#1976d2" : undefined,
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
                    color: isDragging ? "#1976d2" : "inherit",
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
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => void handleFileSelect(e.target.files)}
                />
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!enabled}
                  sx={{
                    p: 0.75,
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      backgroundColor: "action.hover",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                {props.supportAudio ? (
                  <AutoBePlaygroundChatVoiceMovie
                    enabled={enabled}
                    complete={(v) => setBuckets([...buckets, v])}
                  />
                ) : null}
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => void conversate()}
                  disabled={
                    !enabled ||
                    (text.trim().length === 0 && buckets.length === 0)
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
          )}
        </Paper>
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
    uploadFile?: (file: File) => Promise<{ id: string }>;
    uploadImage?: (file: File) => Promise<{ url: string }>;
    supportAudio: boolean;
  }
}
