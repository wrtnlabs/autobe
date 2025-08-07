import {
  AutoBeUserMessageContent,
  AutoBeUserMessageFileContent,
} from "@autobe/interface";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { Box, Button, Chip, IconButton, Input, Toolbar } from "@mui/material";
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

  const handleKeyUp = async (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && event.shiftKey === false) {
      if (enabled === false) event.preventDefault();
      else await conversate();
    }
  };

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
    props.handleResize();
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
    props.handleResize();
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
    props.handleResize();

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
    <Box
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        border: isDragging ? "2px dashed #1976d2" : "none",
        borderRadius: 1,
        transition: "border 0.2s",
      }}
    >
      <Toolbar>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => void handleFileSelect(e.target.files)}
        />
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={!enabled}
          sx={{ mr: 1 }}
        >
          <AttachFileIcon />
        </IconButton>
        <Input
          inputRef={inputRef}
          fullWidth
          placeholder={
            emptyText
              ? "Cannot send empty message"
              : isDragging
                ? "Drop files here..."
                : "Conversate with AI Chatbot"
          }
          value={text}
          multiline={true}
          onKeyUp={(e) => void handleKeyUp(e).catch(() => {})}
          onChange={(e) => {
            setText(e.target.value);
            props.handleResize();
          }}
          error={emptyText}
          sx={{
            "& .MuiInputBase-input": {
              color: isDragging ? "#1976d2" : "inherit",
            },
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
      {attachedFiles.length > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          {attachedFiles.map(({ file }, index) => (
            <Chip
              key={index}
              label={file.name}
              size="small"
              onDelete={() => removeFile(index)}
              deleteIcon={<CloseIcon />}
              sx={{
                mr: 1,
                mb: 0.5,
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
    </Box>
  );
};
export namespace AutoBePlaygroundChatPromptMovie {
  export interface IProps {
    conversate: (messages: AutoBeUserMessageContent[]) => Promise<void>;
    handleResize: () => void;
    setError: (error: Error) => void;
    upload?: (file: File) => Promise<string>;
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
