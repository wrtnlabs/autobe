import { AutoBeUserMessageContent } from "@autobe/interface";
import {
  AutoBeChatUploadSendButton,
  AutoBeFileUploadBox,
  AutoBeVoiceRecoderButton,
} from "@autobe/ui";
import { AutoBeFileUploader } from "@autobe/ui/utils";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Chip, Paper, TextField, Typography } from "@mui/material";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";

import { IAutoBePlaygroundBucket } from "../../structures/IAutoBePlaygroundBucket";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";

export const AutoBePlaygroundChatUploadMovie = (
  props: AutoBePlaygroundChatUploadMovie.IProps,
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("");
  const [buckets, setBuckets] = useState<IAutoBePlaygroundBucket[]>([]);
  const [extensionError, setExtensionError] = useState<ReactNode | null>(null);

  const [emptyText, setEmptyText] = useState(false);

  const removeFile = (index: number) => {
    setBuckets(buckets.filter((_, i) => i !== index));
  };

  const conversate = async () => {
    if (enabled === false) return;

    if (text.trim().length === 0 && buckets.length === 0) {
      setEmptyText(true);
      return;
    }

    const messages = [
      {
        type: "text",
        text: text.trim(),
      },
      ...buckets.map(({ content }) => content),
    ] as AutoBeUserMessageContent[];

    setEnabled(false);
    setEmptyText(false);
    setText("");
    setBuckets([]);

    try {
      await props.conversate(messages);
    } catch (error) {
      props.setError(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
    setEnabled(true);
  };
  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    setEnabled(false);
    setExtensionError(null);

    const newFiles: IAutoBePlaygroundBucket[] = [];
    const errorFileNames: string[] = [];

    for (const file of fileList) {
      try {
        newFiles.push(
          await AutoBeFileUploader.compose(props.uploadConfig ?? {}, file),
        );
      } catch (error) {
        errorFileNames.push(file.name);
      }
    }
    if (errorFileNames.length > 0) {
      const extensions: string[] = Array.from(
        new Set(errorFileNames.map((n) => n.split(".").pop() ?? "unknown")),
      ).sort();
      setExtensionError(
        <>
          <h2>
            Unsupported extension{extensions.length > 1 ? "s" : ""}: (
            {extensions.join(", ")})
          </h2>
          <ul>
            {errorFileNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </>,
      );
      setTimeout(() => setExtensionError(null), 5_000);
    }
    setBuckets((o) => [...o, ...newFiles]);
    setEnabled(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the entire container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  };

  useEffect(() => {
    if (!props.listener?.current) return;
    props.listener.current.handleDragEnter = handleDragEnter;
    props.listener.current.handleDragLeave = handleDragLeave;
    props.listener.current.handleDrop = handleDrop;
    props.listener.current.handleDragOver = handleDragOver;
  }, [props.listener]);

  return (
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
              fontSize: "0.95rem",
              color: dragging ? "#1976d2" : "inherit",
            },
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={AutoBeFileUploader.getAcceptAttribute(
            props.uploadConfig?.supportAudio ?? false,
            !!props.uploadConfig?.file,
          )}
          style={{ display: "none" }}
          onChange={(e) => {
            void handleFileSelect(e.target.files);
            // Reset input to allow selecting the same file again
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <AutoBeFileUploadBox
            extensionError={extensionError}
            onClick={() => fileInputRef.current?.click()}
            enabled={enabled}
          />
          {props.uploadConfig?.supportAudio === true ? (
            <AutoBeVoiceRecoderButton
              enabled={enabled}
              onComplete={(content) => setBuckets((o) => [...o, content])}
            />
          ) : null}
          <AutoBeChatUploadSendButton
            onClick={() => conversate()}
            enabled={enabled}
          />
        </Box>
      </Box>
    </Paper>
  );
};
export namespace AutoBePlaygroundChatUploadMovie {
  export interface IProps {
    listener: RefObject<IListener>;
    uploadConfig?: IAutoBePlaygroundUploadConfig;
    conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
    setError: (error: Error) => void;
  }
  export interface IListener {
    handleDragEnter: (event: React.DragEvent) => void;
    handleDragLeave: (event: React.DragEvent) => void;
    handleDragOver: (event: React.DragEvent) => void;
    handleDrop: (event: React.DragEvent) => void;
  }
}
