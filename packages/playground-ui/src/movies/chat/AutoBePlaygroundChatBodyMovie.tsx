import {
  AutoBeUserMessageAudioContent,
  AutoBeUserMessageContent,
  AutoBeUserMessageFileContent,
  AutoBeUserMessageImageContent,
  IAutoBeRpcService,
} from "@autobe/interface";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
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
import { IAutoBePlaygroundEventGroup } from "../../structures/IAutoBePlaygroundEventGroup";
import { AutoBePlaygroundEventMovie } from "../events/AutoBePlaygroundEventMovie";

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
  const [attachedFiles, setAttachedFiles] = useState<IFileContent[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [_audioChunks, setAudioChunks] = useState<Blob[]>([]);

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
    const newFiles: IFileContent[] = [];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const file: File = fileList[i];
        const content:
          | AutoBeUserMessageFileContent
          | AutoBeUserMessageImageContent
          | AutoBeUserMessageAudioContent = await (async () => {
          const isImage = file.type.startsWith("image/");
          // Check for common audio MIME types (wav and mp3)
          const isAudio =
            props.supportAudio &&
            file.type.startsWith("audio/") &&
            (file.type === "audio/mpeg" ||
              file.type === "audio/mp3" ||
              file.type === "audio/wav" ||
              file.type === "audio/x-wav" ||
              file.type === "audio/wave" ||
              file.type === "audio/x-wave");

          if (isImage)
            return {
              type: "image",
              image: props.uploadImage
                ? {
                    type: "url",
                    url: await props.uploadImage(file).then((res) => res.url),
                  }
                : {
                    type: "base64",
                    data: await fileToBase64(file),
                  },
            };
          else if (isAudio)
            return {
              type: "audio",
              data: await fileToBase64(file),
              format: file.type.includes("wav") ? "wav" : "mp3",
            };

          return {
            type: "file",
            file: props.uploadFile
              ? {
                  type: "id",
                  id: await props.uploadFile(file).then((res) => res.id),
                }
              : {
                  type: "base64",
                  name: file.name,
                  data: await fileToBase64(file),
                },
          };
        })();
        newFiles.push({ file, content });
      } catch {
        continue;
      }
    }
    setAttachedFiles([...attachedFiles, ...newFiles]);
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

      // Add text message if present
      if (text.trim().length > 0) {
        messages.push({
          type: "text",
          text,
        });
      }

      // Add attached files as file messages
      for (const { content } of attachedFiles) messages.push(content);

      await props.conversate(messages);
      setAttachedFiles([]); // Clear attached files after sending
    } catch (error) {
      props.setError(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    }
    setEnabled(true);
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          // Convert to WAV format
          const wavBlob = await convertToWav(audioBlob);
          const audioFile = new File([wavBlob], `recording-${Date.now()}.wav`, {
            type: "audio/wav",
          });

          // Add to attached files
          const base64 = await fileToBase64(audioFile);
          const audioContent: AutoBeUserMessageAudioContent = {
            type: "audio",
            data: base64,
            format: "wav",
          };

          setAttachedFiles([
            ...attachedFiles,
            { file: audioFile, content: audioContent },
          ]);
        } catch (error) {
          props.setError(
            error instanceof Error
              ? error
              : new Error("Failed to process audio recording"),
          );
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      props.setError(
        error instanceof Error ? error : new Error("Failed to start recording"),
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
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
          left: props.isMobile
            ? 0
            : (props.sideWidth ?? AutoBePlaygroundGlobal.SIDE_WIDTH),
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
                  color={isRecording ? "error" : "primary"}
                  onClick={
                    isRecording ? stopRecording : () => void startRecording()
                  }
                  disabled={!enabled}
                  sx={{
                    p: 0.75,
                    border: "1px solid",
                    borderColor: isRecording ? "error.main" : "divider",
                    backgroundColor: isRecording
                      ? "error.light"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isRecording
                        ? "error.main"
                        : "action.hover",
                      borderColor: isRecording ? "error.dark" : "primary.main",
                      color: isRecording ? "error.contrastText" : "inherit",
                    },
                  }}
                >
                  {props.supportAudio ? (
                    isRecording ? (
                      <StopIcon fontSize="small" />
                    ) : (
                      <MicIcon fontSize="small" />
                    )
                  ) : null}
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
          )}
        </Paper>
      </Box>
    </div>
  );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Remove the data URL prefix to get pure base64
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert audio blob to WAV format
const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create WAV file
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;

  // Calculate WAV file size
  const wavLength = 44 + length * numberOfChannels * 2;
  const buffer = new ArrayBuffer(wavLength);
  const view = new DataView(buffer);

  // WAV file header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, wavLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, length * numberOfChannels * 2, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const value = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, value * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
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
    sideWidth?: number;
  }
}

interface IFileContent {
  file: File;
  content:
    | AutoBeUserMessageAudioContent
    | AutoBeUserMessageFileContent
    | AutoBeUserMessageImageContent;
}
