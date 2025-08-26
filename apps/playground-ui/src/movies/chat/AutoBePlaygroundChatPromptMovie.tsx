import { AutoBeUserMessageContent } from "@autobe/interface";
import { Box, Paper, Typography } from "@mui/material";
import { RefObject, useState } from "react";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IAutoBePlaygroundUploadConfig } from "../../structures/IAutoBePlaygroundUploadConfig";
import { AutoBePlaygroundChatUploadMovie } from "./AutoBePlaygroundChatUploadMovie";

export const AutoBePlaygroundChatPromptMovie = (
  props: AutoBePlaygroundChatPromptMovie.IProps,
) => {
  const [dragging, setDragging] = useState(false);

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
          <AutoBePlaygroundChatUploadMovie
            dragging={dragging}
            setDragging={setDragging}
            listener={props.listener}
            uploadConfig={props.uploadConfig}
            conversate={props.conversate}
            setError={props.setError}
          />
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
