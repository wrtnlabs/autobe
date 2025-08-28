import { AutoBeUserMessageContent } from "@autobe/interface";
import {
  AutoBeUserMessageAudioContent,
  AutoBeUserMessageFileContent,
  AutoBeUserMessageImageContent,
} from "@autobe/interface";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";

import {
  AutoBeChatUploadSendButton,
  AutoBeFileUploadBox,
  AutoBeVoiceRecoderButton,
} from ".";
import { AutoBeFileUploader } from "./utils";

export interface IAutoBeBucket {
  file: File;
  content:
    | AutoBeUserMessageAudioContent
    | AutoBeUserMessageFileContent
    | AutoBeUserMessageImageContent;
}

export interface IAutoBeChatUploadConfig {
  supportAudio?: boolean;
  file?: (file: File) => Promise<{ id: string }>;
  image?: (file: File) => Promise<{ url: string }>;
}

export const AutoBeChatUploadBox = (props: AutoBeChatUploadBox.IProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("");
  const [buckets, setBuckets] = useState<IAutoBeBucket[]>([]);
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

    const newFiles: IAutoBeBucket[] = [];
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
    <div
      style={{
        maxWidth: "768px",
        margin: "0 auto",
        padding: "12px",
        borderRadius: "16px",
        border: dragging ? "3px solid #1976d2" : "2px solid #e0e0e0",
        backgroundColor: dragging
          ? "rgba(25, 118, 210, 0.04)"
          : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        transition: "all 0.2s",
        position: "relative",
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.12)",
      }}
    >
      {dragging ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "120px",
            paddingTop: "32px",
            paddingBottom: "32px",
          }}
        >
          <h6
            style={{
              color: "#1976d2",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: "1.25rem",
              margin: 0,
            }}
          >
            Drop files here to upload
          </h6>
        </div>
      ) : null}

      <div
        style={{
          display: dragging ? "none" : "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {buckets.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
            }}
          >
            {buckets.map(({ file }, index) => (
              <div
                key={index}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "16px",
                  padding: "4px 8px",
                  fontSize: "0.875rem",
                  maxWidth: "200px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  {file.name}
                </span>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                  }}
                  onClick={() => removeFile(index)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          style={{
            width: "100%",
            minHeight: "40px",
            maxHeight: "192px",
            padding: "8px 12px",
            border: `2px solid ${emptyText ? "#f44336" : dragging ? "#1976d2" : "#e0e0e0"}`,
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            color: dragging ? "#1976d2" : "inherit",
            backgroundColor: "transparent",
            transition: "border-color 0.2s",
          }}
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
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#1976d2";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = emptyText
              ? "#f44336"
              : "#e0e0e0";
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

        <div
          style={{
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
        </div>
      </div>
    </div>
  );
};

export namespace AutoBeChatUploadBox {
  export interface IProps {
    listener: RefObject<IListener>;
    uploadConfig?: IAutoBeChatUploadConfig;
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
