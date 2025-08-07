import {
  AutoBeUserMessageContent,
  AutoBeUserMessageFileContent,
} from "@autobe/interface";
import AddIcon from "@mui/icons-material/Add";
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
import { useRef, useState } from "react";

export const AutoBePlaygroundChatPromptMovie = (
  props: AutoBePlaygroundChatPromptMovie.IProps,
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [emptyText, setEmptyText] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      file: File;
      content:
        | AutoBeUserMessageFileContent.IReference
        | AutoBeUserMessageFileContent.IData;
    }>
  >([]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setEnabled(false);
    try {
      const newFiles: Array<{
        file: File;
        content:
          | AutoBeUserMessageFileContent.IReference
          | AutoBeUserMessageFileContent.IData;
      }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileContent:
          | AutoBeUserMessageFileContent.IReference
          | AutoBeUserMessageFileContent.IData;

        if (props.upload) {
          // Use provided upload function - returns ID
          const id = await props.upload(file);
          fileContent = {
            type: "reference",
            id,
          };
        } else {
          // Convert to base64 data
          const base64 = await fileToBase64(file);
          fileContent = {
            type: "data",
            name: file.name,
            data: base64,
          };
        }
        newFiles.push({ file, content: fileContent });
      }
      setAttachedFiles([...attachedFiles, ...newFiles]);
    } catch (error) {
      props.setError(
        error instanceof Error ? error : new Error("File processing failed"),
      );
    }
    setEnabled(true);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const conversate = async () => {
    setText("");
    const hasContent = text.trim().length > 0 || attachedFiles.length > 0;

    if (!hasContent) {
      setEmptyText(true);
      return;
    }

    setEmptyText(false);
    setEnabled(false);

    try {
      const messages: AutoBeUserMessageContent[] = [];

      // Add attached files as file messages
      for (const { content } of attachedFiles) {
        messages.push({
          type: "file",
          file: content,
        });
      }

      // Add text message if present
      if (text.trim().length > 0) {
        messages.push({
          type: "text",
          text,
        });
      }

      await props.conversate(messages);
      setAttachedFiles([]); // Clear attached files after sending
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
    setIsDragging(false);
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
    <>
      {/* Full screen drag overlay */}
      {isDragging && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            backdropFilter: "blur(2px)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Drop files here to upload
          </Typography>
        </Box>
      )}

      {/* Prompt input area */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: props.isMobile ? 0 : (props.sideWidth ?? 450),
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
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {attachedFiles.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {attachedFiles.map(({ file }, index) => (
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
              <IconButton
                size="small"
                color="primary"
                onClick={() => void conversate()}
                disabled={
                  !enabled ||
                  (text.trim().length === 0 && attachedFiles.length === 0)
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
    </>
  );
};
export namespace AutoBePlaygroundChatPromptMovie {
  export interface IProps {
    conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
    setError: (error: Error) => void;
    upload?: (file: File) => Promise<string>;
    isMobile?: boolean;
    sideWidth?: number;
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const entire: string = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const data = entire.split(",")[1];
      resolve(data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
