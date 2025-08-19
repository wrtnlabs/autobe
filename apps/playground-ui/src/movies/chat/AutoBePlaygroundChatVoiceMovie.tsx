import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { IconButton } from "@mui/material";
import { useState } from "react";

import { IAutoBePlaygroundBucket } from "../../structures/IAutoBePlaygroundBucket";
import { AutoBePlaygroundVoiceRecorder } from "../../utils/AutoBePlaygroundVoiceRecorder";

export const AutoBePlaygroundChatVoiceMovie = (
  props: AutoBePlaygroundChatVoiceMovie.IProps,
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const startRecording = async () => {
    const recorder: MediaRecorder = await AutoBePlaygroundVoiceRecorder.start(
      (file) => {
        props.complete(file);
      },
    );
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <IconButton
      size="small"
      color={isRecording ? "error" : "primary"}
      onClick={isRecording ? stopRecording : () => void startRecording()}
      disabled={!props.enabled}
      sx={{
        p: 0.75,
        border: "1px solid",
        borderColor: isRecording ? "error.main" : "divider",
        backgroundColor: isRecording ? "error.light" : "transparent",
        "&:hover": {
          backgroundColor: isRecording ? "error.main" : "action.hover",
          borderColor: isRecording ? "error.dark" : "primary.main",
          color: isRecording ? "error.contrastText" : "inherit",
        },
      }}
    >
      {isRecording ? (
        <StopIcon fontSize="small" />
      ) : (
        <MicIcon fontSize="small" />
      )}
    </IconButton>
  );
};
export namespace AutoBePlaygroundChatVoiceMovie {
  export interface IProps {
    enabled: boolean;
    complete: (bucket: IAutoBePlaygroundBucket) => void;
  }
}
