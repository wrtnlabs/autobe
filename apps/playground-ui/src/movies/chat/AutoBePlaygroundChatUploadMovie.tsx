import { AutoBeUserMessageContent } from "@autobe/interface";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Chip, IconButton, TextField } from "@mui/material";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";

import { IAutoBePlaygroundBucket } from "../../structures/IAutoBePlaygroundBucket";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";
import { AutoBePlaygroundFileUploader } from "../../utils/AutoBePlaygroundFileUploader";
import { AutoBePlaygroundChatUploadFile } from "./AutoBePlaygroundChatUploadFile";
import { AutoBePlaygroundChatVoiceMovie } from "./AutoBePlaygroundChatVoiceMovie";

export const AutoBePlaygroundChatUploadMovie = (
  props: AutoBePlaygroundChatUploadMovie.IProps,
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    setEnabled(false);
    setExtensionError(null);

    const newFiles: IAutoBePlaygroundBucket[] = [];
    const errorFileNames: string[] = [];

    for (const file of fileList) {
      try {
        newFiles.push(
          await AutoBePlaygroundFileUploader.compose(
            props.uploadConfig ?? {},
            file,
          ),
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
    props.setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the entire container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      props.setDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.setDragging(false);

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
    <>
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
            : props.dragging
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
              borderColor: props.dragging ? "#1976d2" : undefined,
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
            color: props.dragging ? "#1976d2" : "inherit",
          },
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={AutoBePlaygroundFileUploader.getAcceptAttribute(
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
        <AutoBePlaygroundChatUploadFile
          extensionError={extensionError}
          onClick={() => fileInputRef.current?.click()}
          enabled={enabled}
        />
        {props.uploadConfig?.supportAudio === true ? (
          <AutoBePlaygroundChatVoiceMovie
            enabled={enabled}
            complete={(b) => setBuckets((o) => [...o, b])}
          />
        ) : null}
        <AutoBePlaygroundChatUploadSendButton
          conversate={conversate}
          enabled={enabled}
        />
      </Box>
    </>
  );
};

const AutoBePlaygroundChatUploadSendButton = (props: {
  conversate: () => Promise<void>;
  enabled: boolean;
}) => {
  return (
    <IconButton
      size="small"
      color="primary"
      onClick={() => void props.conversate()}
      disabled={!props.enabled}
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
  );
};

export namespace AutoBePlaygroundChatUploadMovie {
  export interface IProps {
    dragging: boolean;
    setDragging: (value: boolean) => void;
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
