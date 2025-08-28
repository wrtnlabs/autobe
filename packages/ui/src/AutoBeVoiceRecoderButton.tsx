import { AutoBeUserMessageAudioContent } from "@autobe/interface";
import { useState } from "react";

import { AutoBeVoiceRecorder } from "./utils/AutoBeVoiceRecorder";

export const AutoBeVoiceRecoderButton = (
  props: AutoBeVoiceRecoderButton.IProps,
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const startRecording = async () => {
    const recorder = await AutoBeVoiceRecorder.start(props.onComplete);
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

  const baseStyles: React.CSSProperties = {
    padding: "6px",
    border: "1px solid",
    borderColor: isRecording ? "#f44336" : "#e0e0e0",
    borderRadius: "4px",
    backgroundColor: isRecording ? "#ffebee" : "transparent",
    color: isRecording ? "#f44336" : "#1976d2",
    cursor: props.enabled ? "pointer" : "not-allowed",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    outline: "none",
    width: "32px",
    height: "32px",
    opacity: props.enabled ? 1 : 0.5,
  };

  const hoverStyles: React.CSSProperties = {
    ...baseStyles,
    backgroundColor: isRecording ? "#f44336" : "#f5f5f5",
    borderColor: isRecording ? "#d32f2f" : "#1976d2",
    color: isRecording ? "#ffffff" : "#1976d2",
  };

  return (
    <button
      style={baseStyles}
      onClick={isRecording ? stopRecording : () => void startRecording()}
      disabled={!props.enabled}
      onMouseEnter={(e) => {
        if (props.enabled) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, baseStyles);
      }}
    >
      {isRecording ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ display: "block" }}
        >
          <path d="M6 6h12v12H6z" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ display: "block" }}
        >
          <path d="M12 2C13.1 2 14 2.9 14 4V10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10V4C10 2.9 10.9 2 12 2ZM19 10V12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12V10H7V12C7 14.761 9.239 17 12 17C14.761 17 17 14.761 17 12V10H19ZM11 20V22H13V20H16V22H8V20H11Z" />
        </svg>
      )}
    </button>
  );
};

export namespace AutoBeVoiceRecoderButton {
  export interface IProps {
    enabled: boolean;
    onComplete: (content: {
      file: File;
      content: AutoBeUserMessageAudioContent;
    }) => void;
  }
}
