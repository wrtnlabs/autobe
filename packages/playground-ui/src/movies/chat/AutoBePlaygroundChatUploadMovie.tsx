import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "@mui/material";
import { RefObject, useEffect, useRef } from "react";

import { IAutoBePlaygroundBucket } from "../../structures/IAutoBePlaygroundBucket";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";
import { AutoBePlaygroundFileUploader } from "../../utils/AutoBePlaygroundFileUploader";
import { AutoBePlaygroundChatVoiceMovie } from "./AutoBePlaygroundChatVoiceMovie";

export const AutoBePlaygroundChatUploadMovie = (
  props: AutoBePlaygroundChatUploadMovie.IProps,
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    props.setEnabled(false);
    const newFiles: IAutoBePlaygroundBucket[] = [];
    for (const file of fileList) {
      try {
        newFiles.push(
          await AutoBePlaygroundFileUploader.compose(
            props.uploadConfig ?? {},
            file,
          ),
        );
      } catch {
        continue;
      }
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
        style={{ display: "none" }}
        onChange={(e) => void handleFileSelect(e.target.files)}
      />
      <IconButton
        size="small"
        color="primary"
        onClick={() => fileInputRef.current?.click()}
        disabled={!props.enabled}
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
