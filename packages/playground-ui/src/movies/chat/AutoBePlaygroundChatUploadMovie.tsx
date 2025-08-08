import AddIcon from "@mui/icons-material/Add";
import ErrorIcon from "@mui/icons-material/Error";
import { IconButton, Tooltip } from "@mui/material";
import { RefObject, useEffect, useRef, useState } from "react";

import { IAutoBePlaygroundBucket } from "../../structures/IAutoBePlaygroundBucket";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";
import { AutoBePlaygroundFileUploader } from "../../utils/AutoBePlaygroundFileUploader";
import { AutoBePlaygroundChatVoiceMovie } from "./AutoBePlaygroundChatVoiceMovie";

export const AutoBePlaygroundChatUploadMovie = (
  props: AutoBePlaygroundChatUploadMovie.IProps,
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    props.setEnabled(false);
    setExtensionError(null);

    const newFiles: IAutoBePlaygroundBucket[] = [];
    const errorExtensions: Set<string> = new Set();

    for (const file of fileList) {
      try {
        newFiles.push(
          await AutoBePlaygroundFileUploader.compose(
            props.uploadConfig ?? {},
            file,
          ),
        );
      } catch (error) {
        errorExtensions.add(file.name.split(".").pop() ?? "unknown");
      }
    }
    if (errorExtensions.size > 0) {
      setExtensionError(
        `Unsupported extensions: ${Array.from(errorExtensions).sort().join(", ")}`,
      );
      // Clear error after 3 seconds
      setTimeout(() => setExtensionError(null), 3_000);
    }
    props.complete(newFiles);
    props.setEnabled(true);
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
      <Tooltip
        title={extensionError || ""}
        open={!!extensionError}
        placement="top"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "error.main",
              "& .MuiTooltip-arrow": {
                color: "error.main",
              },
            },
          },
        }}
      >
        <IconButton
          size="small"
          color={extensionError ? "error" : "primary"}
          onClick={() => fileInputRef.current?.click()}
          disabled={!props.enabled}
          sx={{
            p: 0.75,
            border: "1px solid",
            borderColor: extensionError ? "error.main" : "divider",
            backgroundColor: extensionError ? "error.light" : "transparent",
            "&:hover": {
              backgroundColor: extensionError ? "error.light" : "action.hover",
              borderColor: extensionError ? "error.main" : "primary.main",
            },
            transition: "all 0.3s ease",
          }}
        >
          {extensionError ? (
            <ErrorIcon fontSize="small" />
          ) : (
            <AddIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      {props.uploadConfig?.supportAudio === true ? (
        <AutoBePlaygroundChatVoiceMovie
          enabled={props.enabled}
          complete={(b) => props.complete([b])}
        />
      ) : null}
    </>
  );
};

export namespace AutoBePlaygroundChatUploadMovie {
  export interface IProps {
    enabled: boolean;
    dragging: boolean;
    setEnabled: (value: boolean) => void;
    setDragging: (value: boolean) => void;
    listener: RefObject<IListener>;
    complete: (files: IAutoBePlaygroundBucket[]) => void;
    uploadConfig?: IAutoBePlaygroundUploadConfig;
  }
  export interface IListener {
    handleDragEnter: (event: React.DragEvent) => void;
    handleDragLeave: (event: React.DragEvent) => void;
    handleDragOver: (event: React.DragEvent) => void;
    handleDrop: (event: React.DragEvent) => void;
  }
}
